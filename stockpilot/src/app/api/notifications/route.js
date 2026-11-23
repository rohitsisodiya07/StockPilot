export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import Notification from "@/Model/notificationModel";
import { Op } from "sequelize";

export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const roleId = Number(user.roleId);
        const userId = Number(user.id);

        const whereCondition = {
            [Op.and]: [
                {
                    [Op.or]: [
                        { userId },
                        { userId: null },
                    ],
                },
                {
                    [Op.or]: [
                        { roleId },
                        { roleId: null },
                    ],
                },
            ],
        };

        const notifications = await Notification.findAll({
            where: whereCondition,
            order: [["createdAt", "DESC"]],
            limit: 25,
        });

        const unreadCount = await Notification.count({
            where: {
                ...whereCondition,
                isRead: false,
            },
        });

        return Response.json({
            success: true,
            data: {
                notifications,
                unreadCount,
            },
        });
    } catch (error) {
        console.error("Notifications GET Error:", error);
        const isAuth = error.message === "Invalid or Expired Token";
        return Response.json(
            { success: false, message: error.message || "Failed to load notifications" },
            { status: isAuth ? 401 : 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        let body = {};
        try {
            body = await request.json();
        } catch {}

        const { notificationId, markAll } = body;
        const roleId = Number(user.roleId);
        const userId = Number(user.id);

        if (markAll) {
            await Notification.update(
                { isRead: true },
                {
                    where: {
                        [Op.and]: [
                            {
                                [Op.or]: [{ userId }, { userId: null }],
                            },
                            {
                                [Op.or]: [{ roleId }, { roleId: null }],
                            },
                            { isRead: false },
                        ],
                    },
                }
            );

            return Response.json({
                success: true,
                message: "All notifications marked as read",
            });
        }

        if (notificationId) {
            await Notification.update(
                { isRead: true },
                {
                    where: { id: Number(notificationId) },
                }
            );

            return Response.json({
                success: true,
                message: "Notification marked as read",
            });
        }

        return Response.json(
            { success: false, message: "Missing notificationId or markAll flag" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Notifications PATCH Error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to update notification" },
            { status: 500 }
        );
    }
}
