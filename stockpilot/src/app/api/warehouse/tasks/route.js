export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { StaffTask, User, Warehouse } from "@/Model";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";
import { Op } from "sequelize";

// GET /api/warehouse/tasks - Fetch tasks for current staff or all (admin/manager)
export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const warehouseId = searchParams.get("warehouseId");
        const assignedTo = searchParams.get("assignedTo");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const where = {};

        // If staff (roleId 5), only show tasks assigned to them unless specifically requested
        if (Number(user.roleId) === 5) {
            where.assignedTo = user.id;
        } else if (assignedTo) {
            where.assignedTo = Number(assignedTo);
        }

        if (status && status !== "ALL") {
            where.status = status;
        }

        if (priority && priority !== "ALL") {
            where.priority = priority;
        }

        if (warehouseId && warehouseId !== "all") {
            where.warehouseId = Number(warehouseId);
        }

        const { count, rows } = await StaffTask.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "assignee",
                    attributes: ["id", "name", "email"],
                },
                {
                    model: User,
                    as: "creator",
                    attributes: ["id", "name", "email"],
                },
                {
                    model: Warehouse,
                    as: "warehouse",
                    attributes: ["id", "name", "location"],
                },
            ],
            order: [
                ["status", "ASC"], // PENDING first, then IN_PROGRESS, then COMPLETED
                ["createdAt", "DESC"],
            ],
            limit,
            offset,
        });

        // Quick stats for staff
        const pendingCount = await StaffTask.count({
            where: {
                ...(Number(user.roleId) === 5 ? { assignedTo: user.id } : {}),
                status: "PENDING",
            },
        });

        const inProgressCount = await StaffTask.count({
            where: {
                ...(Number(user.roleId) === 5 ? { assignedTo: user.id } : {}),
                status: "IN_PROGRESS",
            },
        });

        const completedCount = await StaffTask.count({
            where: {
                ...(Number(user.roleId) === 5 ? { assignedTo: user.id } : {}),
                status: "COMPLETED",
            },
        });

        return Response.json({
            success: true,
            data: rows,
            stats: {
                pending: pendingCount,
                inProgress: inProgressCount,
                completed: completedCount,
                total: count,
            },
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit) || 1,
            },
        });
    } catch (error) {
        console.error("GET /api/warehouse/tasks error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to fetch tasks" },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}

// POST /api/warehouse/tasks - Create a task
export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const body = await request.json().catch(() => ({}));
        const { title, description, assignedTo, warehouseId, priority, dueAt } = body;

        if (!title || !title.trim()) {
            return Response.json(
                { success: false, message: "Task title is required" },
                { status: 400 }
            );
        }

        const targetAssignedTo = assignedTo ? Number(assignedTo) : user.id;

        const task = await StaffTask.create({
            title: title.trim(),
            description: description ? description.trim() : null,
            assignedTo: targetAssignedTo,
            warehouseId: warehouseId ? Number(warehouseId) : null,
            priority: priority || "MEDIUM",
            status: "PENDING",
            createdBy: user.id,
            dueAt: dueAt ? new Date(dueAt) : null,
        });

        // Audit log
        try {
            logAudit({
                userId: user.id,
                action: "CREATE",
                entity: "STAFF_TASK",
                entityId: task.id,
                details: {
                    title: task.title,
                    assignedTo: targetAssignedTo,
                    priority: task.priority,
                },
            });

            // Send notification to the assigned staff member
            if (targetAssignedTo !== user.id) {
                createNotification({
                    userId: targetAssignedTo,
                    type: "INFO",
                    title: "New Task Assigned",
                    message: `You have been assigned: "${task.title}"`,
                    link: "/warehouse/tasks",
                });
            }
        } catch {}

        return Response.json(
            {
                success: true,
                message: "Task created successfully",
                data: task,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/warehouse/tasks error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to create task" },
            { status: 500 }
        );
    }
}
