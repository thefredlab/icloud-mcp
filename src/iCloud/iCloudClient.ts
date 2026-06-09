import { createDAVClient } from "tsdav";
import dotenv from "dotenv";

import { db } from "../managers/database";
import { decryptPassword } from "../managers/crypto";

dotenv.config();

export async function getDavClientForUser(pokeUserId: string, server: "caldav" | "carddav" = "caldav") {
    const user = await db("users").where({ pokeUserId }).first();

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const iCloudConnection = await db("icloud_connections").where({ userId: user.id }).first();

    if (!iCloudConnection) {
        throw new Error("ICLOUD_NOT_CONNECTED");
    }

    const plainPassword = decryptPassword(iCloudConnection.encryptedAppPassword, iCloudConnection.iv),
        appleMail = iCloudConnection.appleMail;

    return await createDAVClient({
        serverUrl: server === "caldav" ? "https://caldav.icloud.com" : "https://contacts.icloud.com",
        credentials: {
            username: appleMail,
            password: plainPassword,
        },
        authMethod: "Basic",
        defaultAccountType: server,
    });
}

export function getFilenameFromUrl(url: string): string {
    const parts = url.split("/");

    return parts[parts.length - 1];
}