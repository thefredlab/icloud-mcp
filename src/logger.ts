import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Log after response-completion
    res.on("finish", () => {
        const duration = Date.now() - start,
            userAgent = req.headers["user-agent"],
            host = req.headers.host,
            origin = req.headers.origin,
            pokeUserId = req.headers["x-poke-user-id"],
            ip =
                (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
                req.socket.remoteAddress ||
                "";

        const logEntry = {
            ts: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            host,
            origin,
            userAgent,
            ip: ip.replace("::ffff:", ""),
            pokeUserId
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
}