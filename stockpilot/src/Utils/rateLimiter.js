// In-memory sliding window rate limiter
const rateLimitMap = new Map();

/**
 * Check if a client IP has exceeded max requests in the given window
 * @param {string} key - Identifier (usually IP + endpoint)
 * @param {number} maxRequests - Allowed requests (default 10)
 * @param {number} windowMs - Window duration in ms (default 15 minutes)
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(key, maxRequests = 10, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const clientData = rateLimitMap.get(key) || { requests: [], blockedUntil: 0 };

    // Check if currently blocked
    if (clientData.blockedUntil > now) {
        const resetInSeconds = Math.ceil((clientData.blockedUntil - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            resetInSeconds,
        };
    }

    // Filter out timestamps outside window
    const recentRequests = clientData.requests.filter((timestamp) => now - timestamp < windowMs);
    recentRequests.push(now);

    if (recentRequests.length > maxRequests) {
        // Block for windowMs
        clientData.blockedUntil = now + windowMs;
        rateLimitMap.set(key, clientData);
        return {
            allowed: false,
            remaining: 0,
            resetInSeconds: Math.ceil(windowMs / 1000),
        };
    }

    clientData.requests = recentRequests;
    rateLimitMap.set(key, clientData);

    return {
        allowed: true,
        remaining: maxRequests - recentRequests.length,
        resetInSeconds: Math.ceil(windowMs / 1000),
    };
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(request) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }
    return "127.0.0.1";
}
