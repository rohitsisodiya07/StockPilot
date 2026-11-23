export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { ReturnInspection, Product, Warehouse, User, Inventory, StockMovement } from "@/Model";
import sequelize from "@/lib/db/sequelize";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";
import { cache } from "@/lib/cache";
import { Op } from "sequelize";

// GET /api/warehouse/return-inspections
export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { searchParams } = new URL(request.url);
        const condition = searchParams.get("condition");
        const action = searchParams.get("action");
        const warehouseId = searchParams.get("warehouseId");
        const search = searchParams.get("search");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const where = {};
        if (condition && condition !== "ALL") where.condition = condition;
        if (action && action !== "ALL") where.action = action;
        if (warehouseId && warehouseId !== "all") where.warehouseId = Number(warehouseId);

        if (search && search.trim()) {
            where[Op.or] = [
                { referenceNumber: { [Op.like]: `%${search.trim()}%` } },
                { customerName: { [Op.like]: `%${search.trim()}%` } },
            ];
        }

        const { count, rows } = await ReturnInspection.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "sku", "price"],
                },
                {
                    model: Warehouse,
                    as: "warehouse",
                    attributes: ["id", "name", "location"],
                },
                {
                    model: User,
                    as: "inspector",
                    attributes: ["id", "name", "email"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        return Response.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit) || 1,
            },
        });
    } catch (error) {
        console.error("GET /api/warehouse/return-inspections error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to fetch return inspections" },
            { status: 500 }
        );
    }
}

// POST /api/warehouse/return-inspections - Submit a return inspection
export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const body = await request.json().catch(() => ({}));
        const {
            referenceNumber,
            customerName,
            productId,
            warehouseId,
            quantity,
            condition,
            action,
            reason,
            notes,
        } = body;

        const pId = Number(productId);
        const whId = Number(warehouseId);
        const qty = Number(quantity);

        if (!referenceNumber || !referenceNumber.trim()) {
            return Response.json(
                { success: false, message: "Reference Number / Return Order ID is required" },
                { status: 400 }
            );
        }

        if (!pId || !whId || !qty || qty <= 0) {
            return Response.json(
                { success: false, message: "Valid Product, Warehouse and Quantity are required" },
                { status: 400 }
            );
        }

        const product = await Product.findByPk(pId);
        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        const chosenAction = action || (condition === "DAMAGED" ? "SCRAP" : "RESTOCK");

        let inspectionRecord;

        // Run in transaction if restocking to inventory
        if (chosenAction === "RESTOCK") {
            const t = await sequelize.transaction();
            try {
                inspectionRecord = await ReturnInspection.create(
                    {
                        referenceNumber: referenceNumber.trim(),
                        customerName: customerName ? customerName.trim() : null,
                        productId: pId,
                        warehouseId: whId,
                        quantity: qty,
                        condition: condition || "GOOD",
                        action: "RESTOCK",
                        reason: reason ? reason.trim() : null,
                        inspectedBy: user.id,
                        notes: notes ? notes.trim() : null,
                    },
                    { transaction: t }
                );

                // Restock to inventory
                let inv = await Inventory.findOne({
                    where: { productId: pId, warehouseId: whId },
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                if (!inv) {
                    inv = await Inventory.create(
                        {
                            productId: pId,
                            warehouseId: whId,
                            quantity: qty,
                            reorderLevel: 10,
                        },
                        { transaction: t }
                    );
                } else {
                    await inv.increment("quantity", { by: qty, transaction: t });
                }

                // Log Stock Movement IN
                await StockMovement.create(
                    {
                        inventoryId: inv.id,
                        userId: user.id,
                        type: "IN",
                        quantity: qty,
                        reason: `Customer Return #${referenceNumber.trim()} Restocked`,
                    },
                    { transaction: t }
                );

                await t.commit();
            } catch (err) {
                await t.rollback();
                throw err;
            }
        } else {
            // Action is SCRAP / WRITE-OFF
            inspectionRecord = await ReturnInspection.create({
                referenceNumber: referenceNumber.trim(),
                customerName: customerName ? customerName.trim() : null,
                productId: pId,
                warehouseId: whId,
                quantity: qty,
                condition: condition || "DAMAGED",
                action: "SCRAP",
                reason: reason ? reason.trim() : "Damaged / Defective piece scrapped",
                inspectedBy: user.id,
                notes: notes ? notes.trim() : null,
            });
        }

        try {
            cache.delPrefix("dashboard:");
            logAudit({
                userId: user.id,
                action: "RECEIVE",
                entity: "RETURN_INSPECTION",
                entityId: inspectionRecord.id,
                details: {
                    referenceNumber: inspectionRecord.referenceNumber,
                    condition: inspectionRecord.condition,
                    action: inspectionRecord.action,
                    quantity: qty,
                },
            });

            createNotification({
                roleId: 1,
                type: "INFO",
                title: "Return Inspected",
                message: `Return #${inspectionRecord.referenceNumber} for ${qty}x ${product.name} inspected (${inspectionRecord.action})`,
                link: "/warehouse/returns",
            });
        } catch {}

        return Response.json(
            {
                success: true,
                message: `Return inspection completed successfully. (${chosenAction === "RESTOCK" ? "Stock added back to inventory" : "Marked as scrap"})`,
                data: inspectionRecord,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/warehouse/return-inspections error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to record inspection" },
            { status: 500 }
        );
    }
}
