import * as crypto from "crypto";
import { ENCRYPTION_KEY } from "../config";

export function decryptPassword(encryptedText: string, ivHex: string): string {
    const delimiterIndex = encryptedText.lastIndexOf(":");

    if (delimiterIndex <= 0 || delimiterIndex === encryptedText.length - 1) {
        throw new Error("Invalid encryption format (expected '<ciphertext>:<auth-tag>').");
    }

    const encrypted = encryptedText.slice(0, delimiterIndex),
        authTagHex = encryptedText.slice(delimiterIndex + 1);

    const isHex = (value: string) => /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;

    if (!isHex(encrypted)) throw new Error("Invalid ciphertext format (expected even-length hex).");
    if (!isHex(ivHex) || ivHex.length !== 24)
        throw new Error("Invalid IV format (expected 12-byte hex).");
    if (!isHex(authTagHex) || authTagHex.length !== 32)
        throw new Error("Invalid auth tag format (expected 16-byte hex).");

    const iv = Buffer.from(ivHex, "hex"),
        authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}