export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import sequelize from "@/lib/db/sequelize";
import Inventory from "@/Model/inventoryModel";
import Product from "@/Model/productModel";
import Warehouse from "@/Model/warehouseModel";
import StockMovement from "@/Model/stockMovementModel";
import * as userWarehouseService from "@/Service/userWarehouseService";
import cache from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";

// Admin (1), Inventory Manager (4), and Warehouse Staff (5) can transfer stock
const allowTransfer = roleMiddleware(1, 4, 5);

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowTransfer(user);

        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json(
                { success: false, message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const fromWarehouseId = Number(body?.fromWarehouseId);
        const toWarehouseId = Number(body?.toWarehouseId);
        const productId = Number(body?.productId);
        const quantity = Number(body?.quantity);
        const note = typeof body?.note === "string" ? body.note.trim() : "";

        if (
            !Number.isInteger(fromWarehouseId) || fromWarehouseId <= 0 ||
            !Number.isInteger(toWarehouseId) || toWarehouseId <= 0 ||
            !Number.isInteger(productId) || productId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Valid fromWarehouseId, toWarehouseId, productId and quantity (> 0) are required.",
                },
                { status: 400 }
            );
        }

        if (fromWarehouseId === toWarehouseId) {
            return Response.json(
                {
                    success: false,
                    message: "Source and destination warehouses cannot be the same.",
                },
                { status: 400 }
            );
        }

        // Verify product & warehouses exist
        const [product, fromWarehouse, toWarehouse] = await Promise.all([
            Product.findByPk(productId, { attributes: ["id", "name", "sku"] }),
            Warehouse.findByPk(fromWarehouseId, { attributes: ["id", "name"] }),
            Warehouse.findByPk(toWarehouseId, { attributes: ["id", "name"] }),
        ]);

        if (!product) {
            return Response.json({ success: false, message: "Product not found" }, { status: 404 });
        }
        if (!fromWarehouse) {
            return Response.json({ success: false, message: "Source warehouse not found" }, { status: 404 });
        }
        if (!toWarehouse) {
            return Response.json({ success: false, message: "Destination warehouse not found" }, { status: 404 });
        }

        // Check user has access to source warehouse if not admin
        if (user.roleId !== 1) {
            await userWarehouseService.checkWarehouseAccess(user.id, user.roleId, fromWarehouseId);
        }

        // Transactional Atomic Transfer
        const transferResult = await sequelize.transaction(async (t) => {
            // 1. Lock and check source inventory
            const sourceInventory = await Inventory.findOne({
                where: {
                    productId,
                    warehouseId: fromWarehouseId,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            if (!sourceInventory) {
                throw new Error(`Product '${product.name}' has no inventory record in source warehouse '${fromWarehouse.name}'.`);
            }

            const availableQty = Number(sourceInventory.quantity) || 0;
            if (availableQty < quantity) {
                throw new Error(
                    `Insufficient stock in '${fromWarehouse.name}'. Available: ${availableQty}, Requested: ${quantity}.`
                );
            }

            // Deduct from source
            const newSourceQty = availableQty - quantity;
            await sourceInventory.update({ quantity: newSourceQty }, { transaction: t });

            // Record OUT movement
            const outMovement = await StockMovement.create(
                {
                    inventoryId: sourceInventory.id,
                    type: "OUT",
                    quantity,
                    note: `Transfer to ${toWarehouse.name} (W#${toWarehouseId})${note ? ` - ${note}` : ""}`,
                    userId: user.id,
                },
                { transaction: t }
            );

            // 2. Lock / find or create destination inventory
            const [destInventory] = await Inventory.findOrCreate({
                where: {
                    productId,
                    warehouseId: toWarehouseId,
                },
                defaults: {
                    productId,
                    warehouseId: toWarehouseId,
                    quantity: 0,
                    reorderLevel: 10,
                },
                transaction: t,
                lock: t.LOCK.UPDATE,
            });

            const currentDestQty = Number(destInventory.quantity) || 0;
            const newDestQty = currentDestQty + quantity;
            await destInventory.update({ quantity: newDestQty }, { transaction: t });

            // Record IN movement
            const inMovement = await StockMovement.create(
                {
                    inventoryId: destInventory.id,
                    type: "IN",
                    quantity,
                    note: `Transfer from ${fromWarehouse.name} (W#${fromWarehouseId})${note ? ` - ${note}` : ""}`,
                    userId: user.id,
                },
                { transaction: t }
            );

            return {
                source: {
                    warehouseId: fromWarehouseId,
                    warehouseName: fromWarehouse.name,
                    remainingQuantity: newSourceQty,
                    movementId: outMovement.id,
                },
                destination: {
                    warehouseId: toWarehouseId,
                    warehouseName: toWarehouse.name,
                    newQuantity: newDestQty,
                    movementId: inMovement.id,
                },
            };
        });

        try {
            cache.delPrefix("dashboard:");
            logAudit({
                userId: user.id,
                action: "TRANSFER",
                entity: "STOCK_TRANSFER",
                details: {
                    message: `Inter-warehouse transfer: ${quantity} units of ${product.name}`,
                    fromWarehouse: fromWarehouse.name,
                    toWarehouse: toWarehouse.name,
                    product: product.name,
                    quantity,
                    note,
                },
            });
            createNotification({
                roleId: 1,
                type: "TRANSFER",
                title: "Stock Transfer Executed",
                message: `${quantity} units of ${product.name} transferred from ${fromWarehouse.name} to ${toWarehouse.name}.`,
                link: "/admin/stock-movement",
            });
        } catch (e) {
            // Safe fallback
        }

        return Response.json(
            {
                success: true,
                message: `Successfully transferred ${quantity} units of ${product.name} from ${fromWarehouse.name} to ${toWarehouse.name}`,
                data: transferResult,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Stock Transfer Error:", error);

        const isAuthError = error?.message === "Invalid or Expired Token";
        const isForbidden = error?.message?.includes("Forbidden");
        const isClientError = error?.message?.includes("Insufficient") || error?.message?.includes("no inventory record");

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : isForbidden
                    ? "Forbidden: You do not have permission"
                    : error?.message || "Internal Server Error",
            },
            { status: isAuthError ? 401 : isForbidden ? 403 : isClientError ? 400 : 500 }
        );
    }
}
