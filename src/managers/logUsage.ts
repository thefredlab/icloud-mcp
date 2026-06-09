import { db } from "./database";

export default async function logAndCheckUsage(userId: Number, maxLimit?: Number | null) {
    const currentPeriod = new Date().toISOString().slice(0, 7) + "-01 00:00:00";

    const usage = await db("user_usage")
        .select("requestCount")
        .where({ userId, periodStart: currentPeriod })
        .first();

    // @ts-expect-error maxLimit null checked before
    if (maxLimit !== null && usage && usage.requestCount > maxLimit)
        return false;

    await db("user_usage")
        .insert({
            userId: userId,
            periodStart: currentPeriod,
            requestCount: 1
        })
        .onConflict(["userId", "periodStart"])
        .merge({
            // If exists, count +1 on the existing value
            requestCount: db.raw("user_usage.requestCount + 1")
        });

    return true;
}