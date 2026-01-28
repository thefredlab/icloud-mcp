import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Log after response-completion
    res.on("finish", () => {
        const duration = Date.now() - start,
            origin = req.headers.origin,
            host = req.headers.host,
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
            ip: ip.replace("::ffff:", ""),
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
}