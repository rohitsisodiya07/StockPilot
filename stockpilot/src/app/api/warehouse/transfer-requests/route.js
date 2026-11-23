export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { StockTransferRequest, Product, Warehouse, User, Inventory } from "@/Model";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";
import { Op } from "sequelize";

// GET /api/warehouse/transfer-requests
export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const warehouseId = searchParams.get("warehouseId");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const where = {};
        if (status && status !== "ALL") {
            where.status = status;
        }

        if (warehouseId && warehouseId !== "all") {
            const whId = Number(warehouseId);
            where[Op.or] = [{ fromWarehouseId: whId }, { toWarehouseId: whId }];
        }

        // If staff, show their requests or requests involving their assigned warehouse
        if (Number(user.roleId) === 5) {
            where[Op.or] = [
                ...(where[Op.or] || []),
                { requestedBy: user.id },
            ];
        }

        const { count, rows } = await StockTransferRequest.findAndCountAll({
            where,
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "sku", "price"],
                },
                {
                    model: Warehouse,
                    as: "fromWarehouse",
                    attributes: ["id", "name", "location"],
                },
                {
                    model: Warehouse,
                    as: "toWarehouse",
                    attributes: ["id", "name", "location"],
                },
                {
                    model: User,
                    as: "requester",
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
        console.error("GET /api/warehouse/transfer-requests error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to fetch transfer requests" },
            { status: 500 }
        );
    }
}

// POST /api/warehouse/transfer-requests
export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const body = await request.json().catch(() => ({}));
        const { productId, fromWarehouseId, toWarehouseId, quantity, priority, reason } = body;

        const pId = Number(productId);
        const fromWhId = Number(fromWarehouseId);
        const toWhId = Number(toWarehouseId);
        const qty = Number(quantity);

        if (!pId || !fromWhId || !toWhId || !qty || qty <= 0) {
            return Response.json(
                { success: false, message: "Valid Product, Source Warehouse, Target Warehouse and Quantity are required" },
                { status: 400 }
            );
        }

        if (fromWhId === toWhId) {
            return Response.json(
                { success: false, message: "Source and destination warehouses cannot be the same" },
                { status: 400 }
            );
        }

        // Verify product exists
        const product = await Product.findByPk(pId);
        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // Verify source stock
        const sourceInventory = await Inventory.findOne({
            where: { productId: pId, warehouseId: fromWhId },
        });

        if (!sourceInventory || sourceInventory.quantity < qty) {
            return Response.json(
                {
                    success: false,
                    message: `Insufficient stock in source warehouse. Available: ${sourceInventory?.quantity || 0}`,
                },
                { status: 400 }
            );
        }

        const transferReq = await StockTransferRequest.create({
            productId: pId,
            fromWarehouseId: fromWhId,
            toWarehouseId: toWhId,
            quantity: qty,
            requestedBy: user.id,
            priority: priority || "NORMAL",
            status: "PENDING",
            reason: reason ? reason.trim() : null,
        });

        try {
            logAudit({
                userId: user.id,
                action: "TRANSFER",
                entity: "STOCK_TRANSFER_REQUEST",
                entityId: transferReq.id,
                details: {
                    productId: pId,
                    from: fromWhId,
                    to: toWhId,
                    quantity: qty,
                },
            });

            // Notify Managers & Admins
            createNotification({
                roleId: 1,
                type: "TRANSFER",
                title: "New Transfer Request",
                message: `Staff requested ${qty}x ${product.name} transfer (WH #${fromWhId} ➔ WH #${toWhId})`,
                link: "/warehouse/transfers",
            });
        } catch {}

        return Response.json(
            {
                success: true,
                message: "Stock transfer request submitted successfully",
                data: transferReq,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/warehouse/transfer-requests error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to create transfer request" },
            { status: 500 }
        );
    }
}
