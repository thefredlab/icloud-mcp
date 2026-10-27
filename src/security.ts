import { ALLOWED_HOSTS } from "./config";

import { db } from "./managers/database";

import type { Request, Response, NextFunction } from "express";
import type { User } from "./@types/database";

export function securityMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const hostHeader = (req.headers.host ?? "").toLowerCase();

   // Check host header
   if (ALLOWED_HOSTS.size > 0 && hostHeader) {
      if (!ALLOWED_HOSTS.has(hostHeader)) {
         return res
            .status(403)
            .type("text/plain")
            .send(`Forbidden host: ${hostHeader}`);
      }
   }

   next();
}

export async function apiKeyAuthMiddleware(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const authHeader = req.headers["authorization"] as string || "";
   const [scheme, token] = authHeader.split(" ");

   const apiKey = scheme?.toLowerCase() === "bearer" ? (token || "").trim() : "",
      pokeUserId = req.headers["x-poke-user-id"] as string || "";

   if (!apiKey) {
      return res.status(401).json({error: "Missing API key"});
   }

   if (!pokeUserId) {
      return res.status(401).json({error: "Missing Poke user id"});
   }

   try {
      const user: User | undefined = await db("users").where({apiKey, pokeUserId}).first();

      if (!user) {
         const apiKeyExists = await db("api_keys").where({ apiKey }).andWhereRaw("createdAt >= NOW() - INTERVAL 30 MINUTE").first();

         if (!apiKeyExists) {
            return res.status(401).json({error: "Invalid API key"});
         }

         // Connect the API-Key to the user (new user-setup)
         await db("users").insert({pokeUserId, apiKey});
         await db("api_keys").where({apiKey}).delete();



         (req as Request & { authenticatedUser?: User }).authenticatedUser = await db("users").where({apiKey, pokeUserId}).first();
         return next();
      }

      (req as Request & { authenticatedUser?: User }).authenticatedUser = user;
      next();
   } catch (err) {
      console.error("Database error during authentication:", err);
      return res.status(503).json({error: "Service temporarily unavailable, please try again later"});
   }
}