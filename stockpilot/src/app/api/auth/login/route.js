export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import { loginUser } from "@/Controller/userController";
import { checkRateLimit, getClientIp } from "@/Utils/rateLimiter";

export async function POST(request) {
    try {
        // Apply brute-force protection: Max 10 attempts per 15 minutes per IP
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(`login_${clientIp}`, 10, 15 * 60 * 1000);

        if (!rateLimit.allowed) {
            return Response.json(
                {
                    success: false,
                    message: `Too many login attempts. Please try again in ${rateLimit.resetInSeconds} seconds.`,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimit.resetInSeconds),
                    },
                }
            );
        }

        await connectDB();

        return await loginUser(request);
    } catch (error) {
        console.error("Login Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
