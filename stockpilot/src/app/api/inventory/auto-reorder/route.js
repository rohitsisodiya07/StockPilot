export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import sequelize from "@/lib/db/sequelize";
import Product from "@/Model/productModel";
import Inventory from "@/Model/inventoryModel";
import Supplier from "@/Model/supplierModel";
import PurchaseOrder from "@/Model/purchaseOrderModel";
import PurchaseOrderItem from "@/Model/purchaseOrderItemModel";
import Warehouse from "@/Model/warehouseModel";
import cache from "@/lib/cache";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifier";

// Admins (1) and Inventory Managers (4) can trigger auto-reorders
const allowReorder = roleMiddleware(1, 4);

export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        allowReorder(user);

        let body = {};
        try {
            body = await request.json();
        } catch {
            return Response.json(
                { success: false, message: "Invalid JSON request body" },
                { status: 400 }
            );
        }

        const productId = Number(body?.productId);
        const warehouseId = Number(body?.warehouseId);
        const requestedQuantity = body?.quantity ? Number(body.quantity) : null;

        if (!productId || productId <= 0 || !warehouseId || warehouseId <= 0) {
            return Response.json(
                { success: false, message: "Valid productId and warehouseId are required" },
                { status: 400 }
            );
        }

        const product = await Product.findByPk(productId);
        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        const warehouse = await Warehouse.findByPk(warehouseId);
        if (!warehouse) {
            return Response.json(
                { success: false, message: "Warehouse not found" },
                { status: 404 }
            );
        }

        const inventory = await Inventory.findOne({
            where: { productId, warehouseId },
        });

        const currentQty = inventory ? Number(inventory.quantity) : 0;
        const reorderLvl = inventory ? Number(inventory.reorderLevel) : 10;

        // Auto calculate order quantity: refill up to 2.5x reorder level, minimum 10
        const calculatedQty = Math.max(Math.ceil((reorderLvl * 2.5) - currentQty), 10);
        const finalOrderQty = requestedQuantity && requestedQuantity > 0 ? requestedQuantity : calculatedQty;

        // Find primary supplier
        let supplier = await Supplier.findOne({ order: [["id", "ASC"]] });
        if (!supplier) {
            return Response.json(
                { success: false, message: "No active supplier found in system. Please create a supplier first." },
                { status: 400 }
            );
        }

        // Estimate unit cost (70% of sale price or product price if lower)
        const unitPrice = product.price ? Math.max(1, Math.round(Number(product.price) * 0.7)) : 50;

        // Execute in transaction
        const purchaseOrder = await sequelize.transaction(async (t) => {
            const po = await PurchaseOrder.create(
                {
                    warehouseId,
                    supplierId: supplier.id,
                    createdBy: user.id,
                    status: "DRAFT",
                    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                },
                { transaction: t }
            );

            await PurchaseOrderItem.create(
                {
                    purchaseOrderId: po.id,
                    productId,
                    quantity: finalOrderQty,
                    unitPrice,
                },
                { transaction: t }
            );

            return po;
        });

        // Invalidate dashboard caches
        try {
            cache.delPrefix("dashboard:");
        } catch {}

        // Log Audit Event
        await logAudit({
            userId: user.id,
            action: "REORDER",
            entity: "PURCHASE_ORDER",
            entityId: purchaseOrder.id,
            details: {
                message: `1-Click Auto Reorder: Created Draft PO #${purchaseOrder.id} for ${product.name}`,
                productId,
                productName: product.name,
                warehouseId,
                warehouseName: warehouse.name,
                quantity: finalOrderQty,
                unitPrice,
            },
        });

        // Dispatch in-app notification
        await createNotification({
            roleId: 1, // Notify Admin
            type: "PO_CREATED",
            title: "1-Click Auto Reorder Created",
            message: `Draft PO #PO-${String(purchaseOrder.id).padStart(4, "0")} generated for ${finalOrderQty} units of ${product.name} at ${warehouse.name}.`,
            link: `/admin/purchase-orders`,
        });

        return Response.json({
            success: true,
            message: `Draft Purchase Order #PO-${String(purchaseOrder.id).padStart(4, "0")} created for ${finalOrderQty} units of ${product.name}.`,
            data: {
                purchaseOrderId: purchaseOrder.id,
                productId,
                productName: product.name,
                warehouseName: warehouse.name,
                orderQuantity: finalOrderQty,
                supplierName: supplier.name,
            },
        });
    } catch (error) {
        console.error("Auto Reorder Error:", error);
        return Response.json(
            { success: false, message: error.message || "Failed to trigger auto reorder" },
            { status: 500 }
        );
    }
}
