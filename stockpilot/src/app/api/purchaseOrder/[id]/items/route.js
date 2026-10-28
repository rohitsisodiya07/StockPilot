
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as purchaseOrderItemController from "@/Controller/purchaseOrderItemController";

const handleError = (error, action) => {
    console.error(`${action} Route Error:`, error);

    const message = error?.message || "";

    const isAuthError =
        message === "Invalid or Expired Token" ||
        message === "Unauthorized";

    return Response.json(
        {
            success: false,
            message: isAuthError
                ? message
                : "Internal Server Error",
        },
        {
            status: isAuthError ? 401 : 500,
        }
    );
};

const parseOrderId = (id) => {
    if (
        typeof id !== "string" ||
        !/^[1-9]\d*$/.test(id)
    ) {
        return null;
    }

    const orderId = Number(id);

    return Number.isSafeInteger(orderId)
        ? orderId
        : null;
};

// POST /api/purchase-order/:id/items
export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order ID",
                },
                { status: 400 }
            );
        }

        return await purchaseOrderItemController.createPurchaseOrderItem(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error, "Create Purchase Order Item");
    }
}

// GET /api/purchase-order/:id/items
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order ID",
                },
                { status: 400 }
            );
        }

        // Pass request so controller can read search and pagination
        return await purchaseOrderItemController.getPurchaseOrderItems(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error, "Get Purchase Order Items");
    }
}
