export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import * as userRepository from "@/Repository/userRepository";
import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import { sendAccountApprovedEmail } from "@/lib/mailer";
import { createNotification } from "@/lib/notifier";
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

        const body = await request.json();
        const warehouseId = Number(body?.warehouseId);

        if (!Number.isInteger(warehouseId) || warehouseId <= 0) {
            return Response.json(
                { success: false, message: "Please select a valid warehouse to assign." },
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

        const warehouse = await warehouseRepository.getOneWarehouse(warehouseId);
        if (!warehouse) {
            return Response.json(
                { success: false, message: "Selected warehouse not found" },
                { status: 404 }
            );
        }

        // 1. Update user status to ACTIVE
        await user.update({ status: "ACTIVE" });

        // 2. Assign warehouse if not already assigned
        const existingAssignment = await userWarehouseRepository.findAssignment(userId, warehouseId);
        if (!existingAssignment) {
            await userWarehouseRepository.createAssignment({
                userId,
                warehouseId,
            });
        }

        const roleName = Number(user.roleId) === 4 ? "Inventory Manager" : "Warehouse Staff";
        const warehouseName = warehouse.name || "Assigned Warehouse";

        // 3. Send email confirmation to user
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const emailResult = await sendAccountApprovedEmail({
            to: user.email,
            name: user.name,
            roleName,
            warehouseName,
            loginUrl,
        });

        // 4. Send in-app notification to the user
        await createNotification({
            userId: user.id,
            type: "INFO",
            title: "🎉 Account Approved!",
            message: `Your account has been approved and assigned to ${warehouseName}. You can now start operations.`,
            link: Number(user.roleId) === 4 ? "/manager/dashboard" : "/warehouse/dashboard",
        });

        // 5. Log audit trail
        await logAudit({
            userId: adminUser.id,
            action: "APPROVE_USER",
            entity: "User",
            entityId: user.id,
            details: {
                approvedUserName: user.name,
                approvedUserEmail: user.email,
                roleId: user.roleId,
                warehouseId,
                warehouseName,
                emailSent: emailResult?.success ?? true,
            },
        });

        return Response.json({
            success: true,
            message: `User ${user.name} approved and assigned to ${warehouseName}. Confirmation email sent.`,
            data: {
                userId: user.id,
                status: "ACTIVE",
                warehouseId,
                warehouseName,
            },
        });
    } catch (error) {
        console.error("Approve User Error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to approve user." },
            { status: 500 }
        );
    }
}
