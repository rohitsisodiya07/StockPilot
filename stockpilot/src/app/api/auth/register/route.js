export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import * as userService from "@/Service/userService";
import { createNotification } from "@/lib/notifier";
import { checkRateLimit, getClientIp } from "@/Utils/rateLimiter";

export async function POST(request) {
    try {
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(`register_${clientIp}`, 5, 15 * 60 * 1000);

        if (!rateLimit.allowed) {
            return Response.json(
                {
                    success: false,
                    message: `Too many account creation attempts. Please wait ${rateLimit.resetInSeconds} seconds.`,
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

        const body = await request.json();
        const { name, email, password, roleId } = body;

        if (typeof name !== "string" || !name.trim()) {
            return Response.json(
                { success: false, message: "Full Name is required" },
                { status: 400 }
            );
        }

        if (typeof email !== "string" || !email.trim()) {
            return Response.json(
                { success: false, message: "Valid Email is required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return Response.json(
                { success: false, message: "Invalid email format" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 6) {
            return Response.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Only allow registering as Inventory Manager (4) or Warehouse Staff (5)
        const numericRoleId = Number(roleId) || 5;
        if (![4, 5].includes(numericRoleId)) {
            return Response.json(
                {
                    success: false,
                    message: "Self-registration is only allowed for Inventory Manager or Warehouse Staff.",
                },
                { status: 400 }
            );
        }

        // Self-registered accounts are created in PENDING status awaiting Admin approval & warehouse assignment
        const user = await userService.createUser({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            roleId: numericRoleId,
            status: "PENDING",
        });

        // Notify Admin (roleId = 1) of the pending registration request
        const roleLabel = numericRoleId === 4 ? "Inventory Manager" : "Warehouse Staff";
        await createNotification({
            roleId: 1,
            type: "INFO",
            title: "New Account Approval Required",
            message: `${name.trim()} has registered as ${roleLabel}. Please review and assign a warehouse.`,
            link: "/admin/users",
        });

        return Response.json(
            {
                success: true,
                pendingApproval: true,
                message: "Registration request submitted! Your account is pending Admin approval and warehouse assignment. You will receive an email once approved.",
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        roleId: user.roleId,
                        status: "PENDING",
                    },
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration Route Error:", error);

        const message = error.message || "Failed to create account";
        const status = message.includes("Already Exists") ? 409 : 400;

        return Response.json(
            {
                success: false,
                message,
            },
            { status }
        );
    }
}
