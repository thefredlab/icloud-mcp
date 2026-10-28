import { User } from "../@types/database";
import { db } from "../managers/database";
import crypto from "crypto";

export default async function createAndApplySetupKey({ pokeUserId, user }: { pokeUserId: string, user: User | undefined }) {
   if (!pokeUserId) {
      throw new Error("Missing Poke user ID");
   }

   if (!user) {
      throw new Error("Missing user");
   }

   let setupKey: string | undefined,
      isUnique = false;

   for (let i = 0; i < 5 && !isUnique; i++) {
      setupKey = crypto.randomBytes(32).toString("hex");

      // Check if the generated key already exists for this user
      const existingKey = await db("users").where({ setupKey }).first();

      if (!existingKey) {
         isUnique = true;
         await db("users").update({ setupKey }).where({ pokeUserId, userId: user.userId });

         break;
      }
   }
}