import Notification from "@/Model/notificationModel";

/**
 * Dispatch an in-app system notification.
 * userId: optional specific user ID. If null, broadcast to roleId.
 * roleId: 1 (Admin), 4 (Manager), 5 (Staff) or null for all.
 */
export async function createNotification({
    userId = null,
    roleId = null,
    type = "INFO",
    title,
    message,
    link = null,
}) {
    try {
        if (!title || !message) return null;

        return await Notification.create({
            userId,
            roleId,
            type,
            title,
            message,
            link,
            isRead: false,
        });
    } catch (err) {
        console.error("[Notification Error]", err.message);
        return null;
    }
}
