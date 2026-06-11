import dotenv from "dotenv";

import express from "express";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { PORT, VER, ENABLE_CALENDAR, ENABLE_CONTACTS } from "./config";

// Import express tools & middlewares
import { requestLogger } from "./logger";
import { securityMiddleware } from "./security";

// Import toolRegister
import { registerCalendarTools } from "./toolRegister/calendar";
import { mcpContextStorage } from "./managers/context";

dotenv.config();

// Create server
const server = new McpServer({
    name: "icloud-mcp",
    version: VER.toString(),
    title: "iCloud MCP for Poke made by The Fred Lab"
});

console.log("Checking on tool registration...");

// Register server tools
if (ENABLE_CALENDAR) {
    console.log("Registering calendar tools...")
    registerCalendarTools(server);
} else
    console.log("Calendar tools not enabled. Skipping tool registration.");

if (ENABLE_CONTACTS) {
    console.log("Contacts tools enabled but not registered. Tool is under development and not yet available.");
} else
    console.log("Contacts tools not enabled. Skipping tool registration.");

console.log("Tool registration finished.");

// Set up server
async function main() {
    const app = express();

    // Log requests
    app.use(requestLogger);
    // Check for valid origin, host header, and user agent
    app.use(securityMiddleware);
    app.use(express.json());

    const transport = new StreamableHTTPServerTransport({
        // @ts-ignore
        endpoint: "/mcp/shttp",
        enableJsonResponse: true
    });

    await server.connect(transport);

    // assign poke user id
    const handleMcpWithContext = async (req: express.Request, res: express.Response) => {
        const pokeUserId = req.headers["x-poke-user-id"] as string || "";

        await mcpContextStorage.run({ pokeUserId }, async () => {
            await transport.handleRequest(req, res, req.body);
        });
    };

    // Register shttp routes and assign context (poke user id)
    app.all("/mcp/shttp", handleMcpWithContext);
    app.all("/mcp/shttp/{/*path}", handleMcpWithContext);

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