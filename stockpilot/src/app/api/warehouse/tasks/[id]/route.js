export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { StaffTask, User, Warehouse } from "@/Model";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";

// PATCH /api/warehouse/tasks/:id - Update task status or completion notes
export async function PATCH(request, context) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        const { params } = context;
        const id = Number((await params)?.id);

        if (!id || id <= 0) {
            return Response.json(
                { success: false, message: "Invalid Task ID" },
                { status: 400 }
            );
        }

        const task = await StaffTask.findByPk(id);
        if (!task) {
            return Response.json(
                { success: false, message: "Task not found" },
                { status: 404 }
            );
        }

        // Permission: Staff can update their own tasks, Admin/Manager can update any
        if (Number(user.roleId) === 5 && task.assignedTo !== user.id) {
            return Response.json(
                { success: false, message: "Access Denied: Not your assigned task" },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { status, completionNotes } = body;

        const updates = {};
        if (status) {
            updates.status = status;
            if (status === "COMPLETED") {
                updates.completedAt = new Date();
            }
        }
        if (completionNotes !== undefined) {
            updates.completionNotes = completionNotes;
        }

        await task.update(updates);

        try {
            logAudit({
                userId: user.id,
                action: "UPDATE",
                entity: "STAFF_TASK",
                entityId: task.id,
                details: {
                    status: updates.status || task.status,
                    notes: updates.completionNotes,
                },
            });

            // Notify creator if task is completed
            if (task.createdBy && task.createdBy !== user.id && updates.status === "COMPLETED") {
                createNotification({
                    userId: task.createdBy,
                    type: "INFO",
                    title: "Task Completed",
                    message: `Task "${task.title}" was marked COMPLETED by staff member.`,
                    link: "/warehouse/tasks",
                });
            }
        } catch {}

        return Response.json({
            success: true,
            message: "Task updated successfully",
            data: task,
        });
    } catch (error) {
        console.error("PATCH /api/warehouse/tasks/:id error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to update task" },
            { status: 500 }
        );
    }
}
