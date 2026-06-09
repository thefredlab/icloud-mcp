import { db } from "./database";

export default async function catchError(error: any, pokeUserId: string) {
    switch (error.message) {
        case "USER_NOT_FOUND":
            await db("users").insert({pokeUserId});
            return {
                text: `Welcome! Please setup your account here: https://poke.thefredlab.com/setup?user=${pokeUserId}`
            };

        case "ICLOUD_NOT_CONNECTED":
            return {
                text: `Please connect your iCloud account here: https://poke.thefredlab.com/setup?user=${pokeUserId}`
            };

        case "USAGE_LIMIT":
            return {
                text: "You've reached your usage limit. This limit automatically resets on the first of each month. If you need more, please contact us here: emil@thefredlab.com"
            };

        default:
            return {
                text: `Error: ${error.message}`,
                isError: true
            };
    }
}