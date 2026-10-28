import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpContextStorage } from "../managers/context";
import { db } from "../managers/database";

export function registerSetupTools(server: McpServer) {
   server.registerTool("new_account_setup", {
      description: "Returns a URL to a new account setup page, which will allow the user to finish setting up their account and connect it to their Poke user id.",
      outputSchema: z.object({
         url: z.string().url().optional().describe("A URL to a new account setup page, which will allow the user to finish setting up their account and connect it to their Poke user id. In casse of an error, this field will be undefined."),
         error: z.string().optional().describe("If an error occurred, this field will contain the error message.")
      })
   }, async () => {
      const context = mcpContextStorage.getStore(),
         pokeUserId = context?.pokeUserId,
         user = context?.user;

      let structuredContent = {};

      if (!pokeUserId) {
         structuredContent = {
            error: "No Poke user ID found."
         };

         return {
            content: [{type: "text", text: JSON.stringify(structuredContent)}],
            structuredContent
         };
      }

      const setupKey = (await db("users").where({ pokeUserId, userId: user?.userId }).first())?.setupKey;

      if (!setupKey) {
         structuredContent = {
            error: "No setup key found."
         };

         return {
            content: [{type: "text", text: JSON.stringify(structuredContent)}],
            structuredContent
         };
      }

      structuredContent = {
         url: `https://poke.thefredlab.com/setup/icloud?token=${setupKey}`
      };

      return {
         content: [
            {
               type: "text",
               text: JSON.stringify(structuredContent)
            }
         ],
         structuredContent
      };
   });
}