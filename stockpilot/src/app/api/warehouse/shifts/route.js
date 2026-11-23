export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { StaffShift, Warehouse } from "@/Model";
import { logAudit } from "@/lib/audit";

// GET /api/warehouse/shifts - Get active shift and past shift history
export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const activeShift = await StaffShift.findOne({
            where: {
                userId: user.id,
                status: "ACTIVE",
            },
            include: [
                {
                    model: Warehouse,
                    as: "warehouse",
                    attributes: ["id", "name", "location"],
                },
            ],
            order: [["clockIn", "DESC"]],
        });

        const pastShifts = await StaffShift.findAll({
            where: {
                userId: user.id,
                status: "COMPLETED",
            },
            include: [
                {
                    model: Warehouse,
                    as: "warehouse",
                    attributes: ["id", "name", "location"],
                },
            ],
            order: [["clockIn", "DESC"]],
            limit: 20,
        });

        // Calculate total hours this week
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const totalMinutesThisWeek = pastShifts
            .filter((s) => new Date(s.clockIn) >= oneWeekAgo)
            .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

        return Response.json({
            success: true,
            data: {
                activeShift,
                pastShifts,
                stats: {
                    hoursThisWeek: (totalMinutesThisWeek / 60).toFixed(1),
                    totalShiftsRecorded: pastShifts.length,
                },
            },
        });
    } catch (error) {
        console.error("GET /api/warehouse/shifts error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to fetch shift details" },
            { status: 500 }
        );
    }
}

// POST /api/warehouse/shifts - Clock in or Clock out
export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const body = await request.json().catch(() => ({}));
        const { action, warehouseId, notes } = body;

        if (action === "clock-in") {
            const existingActive = await StaffShift.findOne({
                where: { userId: user.id, status: "ACTIVE" },
            });

            if (existingActive) {
                return Response.json({
                    success: true,
                    message: "You are already clocked in",
                    data: existingActive,
                });
            }

            const newShift = await StaffShift.create({
                userId: user.id,
                warehouseId: warehouseId ? Number(warehouseId) : null,
                clockIn: new Date(),
                status: "ACTIVE",
            });

            try {
                logAudit({
                    userId: user.id,
                    action: "LOGIN",
                    entity: "STAFF_SHIFT",
                    entityId: newShift.id,
                    details: { event: "Shift Clock-In", warehouseId },
                });
            } catch {}

            return Response.json(
                {
                    success: true,
                    message: "Shift started! Clocked in successfully.",
                    data: newShift,
                },
                { status: 201 }
            );
        } else if (action === "clock-out") {
            const activeShift = await StaffShift.findOne({
                where: { userId: user.id, status: "ACTIVE" },
            });

            if (!activeShift) {
                return Response.json(
                    { success: false, message: "No active shift found to clock out from" },
                    { status: 400 }
                );
            }

            const now = new Date();
            const startMs = new Date(activeShift.clockIn).getTime();
            const durationMinutes = Math.max(1, Math.round((now.getTime() - startMs) / 60000));

            await activeShift.update({
                clockOut: now,
                status: "COMPLETED",
                durationMinutes,
                notes: notes ? notes.trim() : null,
            });

            try {
                logAudit({
                    userId: user.id,
                    action: "UPDATE",
                    entity: "STAFF_SHIFT",
                    entityId: activeShift.id,
                    details: {
                        event: "Shift Clock-Out",
                        durationMinutes,
                        notes,
                    },
                });
            } catch {}

            return Response.json({
                success: true,
                message: `Shift ended! Total time: ${(durationMinutes / 60).toFixed(1)} hrs.`,
                data: activeShift,
            });
        }

        return Response.json(
            { success: false, message: "Invalid action. Use 'clock-in' or 'clock-out'" },
            { status: 400 }
        );
    } catch (error) {
        console.error("POST /api/warehouse/shifts error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to update shift" },
            { status: 500 }
        );
    }
}
