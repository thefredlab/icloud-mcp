import { createDAVClient } from "tsdav";
import dotenv from "dotenv";

import { db } from "../managers/database";

import { decryptPassword } from "../managers/crypto";
import logAndCheckUsage from "../managers/logUsage";
import devLog from "../util/devLog";

dotenv.config();

export async function getDavClientForUser(pokeUserId: string, server: "caldav" | "carddav" = "caldav") {
    const user = await db("users").where({ pokeUserId }).first();

    devLog("iCloudClient.getDavClientForUser", "pokeUserId, server, user", { pokeUserId, server, user });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (!await logAndCheckUsage(user.id, user.usageLimit)) {
        throw new Error("USAGE_LIMIT");
    }

    const iCloudConnection = await db("icloud_connections").where({ userId: user.id }).first();

    devLog("iCloudClient.getDavClientForUser", "iCloudConnection", { iCloudConnection });

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