import {PMCP_TOKEN, ALLOWED_ORIGINS, ALLOWED_HOSTS, PMCP_ENABLE_AUTH} from "./config";

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

    // Check origin header
    const origin = req.headers.origin as string | undefined;

    if (origin) {
        if (!ALLOWED_ORIGINS.has(origin)) {
            return res
                .status(403)
                .type("text/plain")
                .send(`Forbidden origin: ${origin}`);
        }
    }

    // Bearer authentication
    if (!PMCP_ENABLE_AUTH) return next();

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer "))
        return res.status(401).type("text/plain").send("Missing Bearer token");

    const providedToken = auth.slice("Bearer ".length).trim();

    if (providedToken !== PMCP_TOKEN)
        return res.status(401).type("text/plain").send("Invalid token");

    next();
}