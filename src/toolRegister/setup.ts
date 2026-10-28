import { z } from "zod";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpContextStorage } from "../managers/context";
import { db } from "../managers/database";

export function registerSetupTools(server: McpServer) {
   server.registerTool("new_account_setup", {
      description: "Returns a URL to a new account setup page, which will allow the user to finish setting up their account and connect it to their Poke user id.",
      outputSchema: z.object({
         url: z.string().url()
      })
   }, async () => {
      const context = mcpContextStorage.getStore(),
         pokeUserId = context?.pokeUserId,
         user = context?.user;

      if (!pokeUserId) {
         return {
            content: [{type: "text", text: "No Poke user ID found."}]
         };
      }

      const setupKey = await db("users").where({ pokeUserId, userId: user?.userId }).pluck("setupKey").first();

      if (!setupKey) {
         return {
            content: [{type: "text", text: "No setup key found."}]
         };
      }

      return {
         content: [{type: "text", text: `Setup URL: https://poke.thefredlab.com/setup/icloud?token=${setupKey}`}]
      };
   });
}