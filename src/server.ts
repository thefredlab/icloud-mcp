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
    // Check for valid origin, host header and auth token
    app.use(securityMiddleware);
    app.use(express.json());

    app.post("/shttp", async (req, res) => {
        const pokeUserId = req.headers["x-poke-user-id"] as string || "";

        await mcpContextStorage.run({ pokeUserId }, async () => {
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });

            res.on("close", () => {
                transport.close();
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        });
    });

    app.get("/health",(req, res) => res.json({ ok: true }));

    app.get("/", (req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                name: "iCloud MCP by The Fred Lab",
                version: VER,
                endpoints: {
                    sse: "/sse",
                    message: "/message",
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