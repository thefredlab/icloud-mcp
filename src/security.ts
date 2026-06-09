import { ALLOWED_HOSTS } from "./config";

import type { Request, Response, NextFunction } from "express";

export function securityMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const hostHeader = (req.headers.host ?? "").toLowerCase();

    // Check host header
    if (ALLOWED_HOSTS.size > 0 && hostHeader) {
        if (!ALLOWED_HOSTS.has(hostHeader)) {
            return res
                .status(403)
                .type("text/plain")
                .send(`Forbidden host: ${hostHeader}`);
        }
    }

    // Check user agent header
    // TODO: check Poke's user agent first
    // const userAgent = req.headers["user-agent"]?.toLowerCase() as string | undefined;
    //
    // if (userAgent) {
    //     if (!ALLOWED_USER_AGENTS.has(userAgent)) {
    //         return res
    //             .status(403)
    //             .type("text/plain")
    //             .send(`Forbidden origin: ${origin}`);
    //     }
    // }
    next();
}