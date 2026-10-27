import { createDAVClient } from "tsdav";
import dotenv from "dotenv";

import { db } from "../managers/database";

import { decryptPassword } from "../managers/crypto";
import logAndCheckUsage from "../managers/logUsage";
import devLog from "../util/devLog";

import type { User, UsersICloudConnection } from "../@types/database";

dotenv.config();

export async function getDavClientForUser({pokeUserId, user}: { pokeUserId: string, user?: User }, server: "caldav" | "carddav" = "caldav") {
    if (!user) {
       user = await db("users").where({pokeUserId}).first();
    }

    devLog("iCloudClient.getDavClientForUser", "pokeUserId, server, user", { pokeUserId, server, user });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (!await logAndCheckUsage(user.id, user.usageLimit)) {
        throw new Error("USAGE_LIMIT");
    }

    const iCloudConnection: UsersICloudConnection = await db("users_icloud_connections").where({ userId: user.userId }).first();

    devLog("iCloudClient.getDavClientForUser", "iCloudConnection", { iCloudConnection });

    if (!iCloudConnection) {
        throw new Error("ICLOUD_NOT_CONNECTED");
    }

    const plainPassword = decryptPassword(iCloudConnection.appleAppPassword, iCloudConnection.appleAppPasswordIVHex),
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