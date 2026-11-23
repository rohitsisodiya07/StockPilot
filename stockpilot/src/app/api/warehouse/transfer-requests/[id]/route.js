export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { StockTransferRequest, Inventory, StockMovement, Product, Warehouse } from "@/Model";
import sequelize from "@/lib/db/sequelize";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";
import { cache } from "@/lib/cache";

// PATCH /api/warehouse/transfer-requests/:id - Review and approve/reject/complete
export async function PATCH(request, context) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        const { params } = context;
        const id = Number((await params)?.id);

        if (!id || id <= 0) {
            return Response.json(
                { success: false, message: "Invalid Request ID" },
                { status: 400 }
            );
        }

        const transferReq = await StockTransferRequest.findByPk(id, {
            include: [
                { model: Product, as: "product" },
                { model: Warehouse, as: "fromWarehouse" },
                { model: Warehouse, as: "toWarehouse" },
            ],
        });

        if (!transferReq) {
            return Response.json(
                { success: false, message: "Transfer request not found" },
                { status: 404 }
            );
        }

        if (transferReq.status === "COMPLETED" || transferReq.status === "REJECTED") {
            return Response.json(
                { success: false, message: `Request is already ${transferReq.status}` },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { status, reviewNotes } = body;

        if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
            return Response.json(
                { success: false, message: "Invalid status. Allowed: APPROVED, REJECTED, COMPLETED" },
                { status: 400 }
            );
        }

        // If completing or approving with execution: execute inventory transfer in transaction
        if (status === "COMPLETED") {
            const t = await sequelize.transaction();
            try {
                // Check source inventory
                const sourceInv = await Inventory.findOne({
                    where: {
                        productId: transferReq.productId,
                        warehouseId: transferReq.fromWarehouseId,
                    },
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                if (!sourceInv || sourceInv.quantity < transferReq.quantity) {
                    await t.rollback();
                    return Response.json(
                        {
                            success: false,
                            message: `Insufficient stock in source warehouse (${sourceInv?.quantity || 0} available)`,
                        },
                        { status: 400 }
                    );
                }

                // Decrement source inventory
                await sourceInv.decrement("quantity", {
                    by: transferReq.quantity,
                    transaction: t,
                });

                // Find or create target inventory
                let targetInv = await Inventory.findOne({
                    where: {
                        productId: transferReq.productId,
                        warehouseId: transferReq.toWarehouseId,
                    },
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                if (!targetInv) {
                    targetInv = await Inventory.create(
                        {
                            productId: transferReq.productId,
                            warehouseId: transferReq.toWarehouseId,
                            quantity: 0,
                            reorderLevel: sourceInv.reorderLevel || 10,
                        },
                        { transaction: t }
                    );
                }

                // Increment target inventory
                await targetInv.increment("quantity", {
                    by: transferReq.quantity,
                    transaction: t,
                });

                // Log OUT movement
                await StockMovement.create(
                    {
                        inventoryId: sourceInv.id,
                        userId: user.id,
                        type: "OUT",
                        quantity: transferReq.quantity,
                        reason: `Inter-warehouse Transfer to WH-${transferReq.toWarehouseId} (#REQ-${transferReq.id})`,
                    },
                    { transaction: t }
                );

                // Log IN movement
                await StockMovement.create(
                    {
                        inventoryId: targetInv.id,
                        userId: user.id,
                        type: "IN",
                        quantity: transferReq.quantity,
                        reason: `Inter-warehouse Transfer from WH-${transferReq.fromWarehouseId} (#REQ-${transferReq.id})`,
                    },
                    { transaction: t }
                );

                await transferReq.update(
                    {
                        status: "COMPLETED",
                        reviewedBy: user.id,
                        reviewNotes: reviewNotes || null,
                    },
                    { transaction: t }
                );

                await t.commit();
            } catch (err) {
                await t.rollback();
                throw err;
            }
        } else {
            // Just update status to APPROVED or REJECTED
            await transferReq.update({
                status,
                reviewedBy: user.id,
                reviewNotes: reviewNotes || null,
            });
        }

        try {
            cache.delPrefix("dashboard:");
            logAudit({
                userId: user.id,
                action: status === "COMPLETED" ? "TRANSFER" : "UPDATE",
                entity: "STOCK_TRANSFER_REQUEST",
                entityId: transferReq.id,
                details: { status, reviewNotes },
            });

            // Notify requester
            createNotification({
                userId: transferReq.requestedBy,
                type: status === "COMPLETED" || status === "APPROVED" ? "TRANSFER" : "WARNING",
                title: `Transfer Request ${status}`,
                message: `Your transfer request for ${transferReq.quantity}x ${transferReq.product?.name || "Product"} was ${status}.`,
                link: "/warehouse/transfers",
            });
        } catch {}

        return Response.json({
            success: true,
            message: `Transfer request marked as ${status}`,
            data: transferReq,
        });
    } catch (error) {
        console.error("PATCH /api/warehouse/transfer-requests/:id error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to update transfer request" },
            { status: 500 }
        );
    }
}
