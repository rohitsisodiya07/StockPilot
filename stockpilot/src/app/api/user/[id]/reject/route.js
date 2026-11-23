export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import * as userRepository from "@/Repository/userRepository";
import { logAudit } from "@/lib/audit";

const allowAdminAccess = roleMiddleware(1);

export async function POST(request, { params }) {
    try {
        await connectDB();

        const adminUser = await authMiddleware(request);
        allowAdminAccess(adminUser);

        const { id } = await params;
        const userId = Number(id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return Response.json(
                { success: false, message: "Invalid user ID" },
                { status: 400 }
            );
        }

        const user = await userRepository.getOneUser(userId);
        if (!user) {
            return Response.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Update status to REJECTED
        await user.update({ status: "REJECTED" });

        await logAudit({
            userId: adminUser.id,
            action: "REJECT_USER",
            entity: "User",
            entityId: user.id,
            details: {
                rejectedUserName: user.name,
                rejectedUserEmail: user.email,
                roleId: user.roleId,
            },
        });

        return Response.json({
            success: true,
            message: `User registration for ${user.name} has been rejected.`,
            data: {
                userId: user.id,
                status: "REJECTED",
            },
        });
    } catch (error) {
        console.error("Reject User Error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to reject user." },
            { status: 500 }
        );
    }
}
