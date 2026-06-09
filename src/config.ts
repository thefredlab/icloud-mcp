import "dotenv/config";

export const ALLOWED_USER_AGENTS = new Set(
    (process.env.ALLOWED_USER_AGENTS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
);

export const ALLOWED_HOSTS = new Set(
    (process.env.ALLOWED_HOSTS ?? "")
        .split(",")
        .map((s) => s.toLowerCase().trim())
        .filter(Boolean)
);

export const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY || "";

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, "utf8").length !== 32) {
    console.error("No encryption key found. Please provide one in .env. Process will be terminated.");
    process.exit(1);
}

export const PORT = Number(process.env.PORT ?? 8085);
export const VER = Number(process.env.npm_package_version);

export const DB_HOST = process.env.DB_HOST ?? "";
export const DB_USER = process.env.DB_USER ?? "";
export const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
export const DB_DATABASE = process.env.DB_DATABASE ?? "";
export const DB_POOL_MAX = process.env.DB_POOL_MAX ?? "";

export const ENABLE_CALENDAR = process.env.ENABLE_CALENDAR === "true";
export const ENABLE_CONTACTS = process.env.ENABLE_CONTACTS === "true";