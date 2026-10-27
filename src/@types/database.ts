export interface User {
   /* auto-incrementing primary key */
   id: number;
   /* Unique userId */
   userId: bigint;
   pokeUserId: string;
   apikey: string;
   /* Setup key - null after the user has completed the setup process */
   setupKey: string | null;
   /* Usage limit for the user - null means unlimited usage */
   usageLimit: number | null;
   /* UTC timestamp of the user creation */
   createdAt: number;
}

export interface UsersUsage {
   /* Unique in combination with periodStart */
   userId: bigint;
   /* Current usage count for the current period */
   requestCount: number;
   /* Unique in combination with userId - UTC timestamp of the period start - Always the first day of the current month (e.g. 2026-01-01 00:00:00) */
   periodStart: number;
}

export interface UsersICloudConnection {
   /* Unique userId */
   userId: bigint;
   /* The user's Apple Mail address */
   appleMail: string;
   /* The user's encrypted app password */
   appleAppPassword: string;
   /* The initialization vector used for encryption */
   appleAppPasswordIVHex: string;
   /* UTC timestamp of the connection creation */
   createdAt: number;
}

export interface ApiKey {
   apiKey: string;
   /* UTC timestamp of the API key creation */
   createdAt: number;
}