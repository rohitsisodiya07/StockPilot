export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { AuditLog, StockMovement, Inventory, Product, StaffTask, ReturnInspection, StaffShift } from "@/Model";

// GET /api/warehouse/activity - Unified staff personal activity timeline
export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const targetUserId = Number(user.id);

        // Fetch recent audit logs for this user
        const auditLogs = await AuditLog.findAll({
            where: { userId: targetUserId },
            order: [["createdAt", "DESC"]],
            limit: 30,
        });

        // Fetch recent stock movements by this user
        const stockMovements = await StockMovement.findAll({
            where: { userId: targetUserId },
            include: [
                {
                    model: Inventory,
                    as: "inventory",
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: ["id", "name", "sku"],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 20,
        });

        // Fetch recent shifts
        const shifts = await StaffShift.findAll({
            where: { userId: targetUserId },
            order: [["createdAt", "DESC"]],
            limit: 10,
        });

        // Fetch recent inspections
        const inspections = await ReturnInspection.findAll({
            where: { inspectedBy: targetUserId },
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "sku"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 10,
        });

        // Normalize everything into a clean unified timeline
        const timeline = [];

        auditLogs.forEach((log) => {
            timeline.push({
                id: `audit-${log.id}`,
                type: "AUDIT",
                action: log.action,
                entity: log.entity,
                title: `${log.action} on ${log.entity}`,
                details: log.details?.message || (typeof log.details === "string" ? log.details : JSON.stringify(log.details || {})),
                timestamp: log.createdAt,
            });
        });

        stockMovements.forEach((sm) => {
            timeline.push({
                id: `sm-${sm.id}`,
                type: "MOVEMENT",
                action: sm.type === "IN" ? "STOCK_IN" : "STOCK_OUT",
                entity: "INVENTORY",
                title: `${sm.type === "IN" ? "Restocked / Received" : "Dispatched / Moved"} ${sm.quantity} units`,
                details: `${sm.inventory?.product?.name || "Product"} (Reason: ${sm.reason || "Manual Operation"})`,
                timestamp: sm.createdAt,
            });
        });

        inspections.forEach((insp) => {
            timeline.push({
                id: `insp-${insp.id}`,
                type: "INSPECTION",
                action: insp.action,
                entity: "RETURN_INSPECTION",
                title: `Inspected Return #${insp.referenceNumber}`,
                details: `${insp.quantity}x ${insp.product?.name || "Product"} marked as ${insp.condition} (${insp.action})`,
                timestamp: insp.createdAt,
            });
        });

        shifts.forEach((shift) => {
            timeline.push({
                id: `shift-${shift.id}`,
                type: "SHIFT",
                action: shift.status === "ACTIVE" ? "CLOCK_IN" : "CLOCK_OUT",
                entity: "STAFF_SHIFT",
                title: shift.status === "ACTIVE" ? "Started Shift (Clocked In)" : `Ended Shift (${(shift.durationMinutes / 60).toFixed(1)} hrs)`,
                details: shift.notes || "Floor duty attendance recorded",
                timestamp: shift.clockOut || shift.clockIn,
            });
        });

        // Sort descending by timestamp
        timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return Response.json({
            success: true,
            data: timeline.slice(0, 40),
        });
    } catch (error) {
        console.error("GET /api/warehouse/activity error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to fetch activity log" },
            { status: 500 }
        );
    }
}
