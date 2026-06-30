import dotenv from "dotenv";
import express from "express";
import crypto from "node:crypto";

import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { PORT, VER, ENABLE_CALENDAR, ENABLE_CONTACTS, ENABLE_DEVTOOLS } from "./config";

// Import express tools & middlewares
import { requestLogger } from "./logger";
import { securityMiddleware } from "./security";

// Import toolRegister
import { registerCalendarTools } from "./toolRegister/calendar";
import { mcpContextStorage } from "./managers/context";
import devLog from "./util/devLog";

dotenv.config();

// Create server
function getMCPServer() {
    const server = new McpServer({
        name: "icloud-mcp",
        version: VER.toString(),
        title: "iCloud MCP for Poke made by The Fred Lab"
    });

    // Register server tools
    if (ENABLE_DEVTOOLS) {
        console.log("[!] Registering dev tools... [!]");

        server.registerTool("dev-test-tool", {
            description: "Returns 'hello world!'",
            outputSchema: z.object({
                response: z.string()
            })
        }, () => {
            return {
                content: [{ type: "text", text: "hello world!" }],
                structuredContent: {
                    response: "hello world!"
                }
            };
        });
    }

    let logMsg = "";

    if (ENABLE_CALENDAR) {
        console.log("Registering calendar tools...")
        registerCalendarTools(server);
    } else
        logMsg += "Calendar tools not enabled. ";

    if (ENABLE_CONTACTS) {
        console.log("Contacts tools enabled but not registered. Tool is under development and not yet available.");
    } else
        logMsg += "Contacts tools not enabled. ";

    if (logMsg.length > 0)
        console.log(logMsg + "Skipping tool registration.");

    return server;
}

// Set up server
async function main() {
    const app = express();

    const activeSessions = new Map<string, {
        transport: StreamableHTTPServerTransport,
        server: McpServer,
        pokeUserId: string
    }>();

    // Log requests
    app.use(requestLogger);
    // Check for valid origin, host header, and user agent
    app.use(securityMiddleware);
    app.use(express.json());

    // assign poke user id
    const handleMcpWithContext = async (req: express.Request, res: express.Response) => {
        let pokeUserId = req.headers["x-poke-user-id"] as string || "LOCAL-DEV",
            sessionId = req.headers["mcp-session-id"] as string || "";

        let transport: StreamableHTTPServerTransport;

        console.log("––––––");
        console.log(`[REQ] Method: ${req.method} | SID: ${sessionId || "New"}`);

        devLog("server.handleMcpWithContext", "req.headers", Array(req.headers));
        devLog("server.handleMcpWithContext", "req.body", Array(req.body));

        if (req.method === "GET" && (!req.headers.accept || req.headers.accept === "*/*")) {
            req.headers.accept = "application/json";
        }

        if (req.method === "DELETE" && sessionId && activeSessions.has(sessionId)) {
            const session = activeSessions.get(sessionId)!;

            console.log(`[INFO] Closing session ${sessionId} for user ${session.pokeUserId}`);
            await session.server.close();
            activeSessions.delete(sessionId);
        }

        if (sessionId && sessionId.length > 0) {
            const sessionData = activeSessions.get(sessionId);

            if (!sessionData) {
                return res.status(404).json({ error: "Session expired or not found" });
            }

            if (pokeUserId !== sessionData.pokeUserId) {
                return res.status(403).json({ error: "Poke user ID mismatch" });
            }

            transport = sessionData.transport;
        } else {
            const server = getMCPServer();

            transport = new StreamableHTTPServerTransport({
                // @ts-ignore
                endpoint: "/mcp/shttp",
                enableJsonResponse: true,
                sessionIdGenerator: () => crypto.randomUUID(),
                onsessioninitialized: sid => {
                    // store the transport by session ID when the session is initialized
                    sessionId = sid;
                    console.log("[SESSION_START]", `New session (${sid}) for user (${pokeUserId}). Active: ${activeSessions.size}`);
                    activeSessions.set(sid, {
                        transport,
                        server,
                        pokeUserId
                    });
                }
            });

            await server.connect(transport);

            req.on("close", async () => {
                await transport.close();
                activeSessions.delete(sessionId);
                console.log("[SESSION_STOP]", `Session ${sessionId} removed. Remaining: ${activeSessions.size}`);
            });
        }

        req.on("error", async (error) => {
            console.error(`[SESSION_STOP] Error: ${error.message}`);
        });

        await mcpContextStorage.run({ pokeUserId }, async () => {
            await transport.handleRequest(req, res, req.body);
        });
    };

    // Register shttp routes and assign context (poke user id)
    app.all("/mcp/shttp", handleMcpWithContext);
    app.all("/mcp/shttp{/*path}", handleMcpWithContext);

    app.get("/mcp/health",(req, res) => res.json({ ok: true }));

    app.get("/mcp", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                name: "iCloud MCP by The Fred Lab",
                version: VER,
                endpoints: {
                    shttp: "/mcp/shttp"
                }
            })
        );
    });

    app.listen(PORT, () => {
        console.log(`MCP listens at http://localhost:${PORT}`);
    }).on("error", (error) => {
        console.error("Server error:", error);
        process.exit(1);
    });
}

main().catch((err) => {
    console.error("Error at start:", err);
    process.exit(1);
});