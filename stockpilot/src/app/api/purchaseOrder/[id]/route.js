
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";

import {
    getOnePurchaseOrder,
    updatePurchaseOrder,
    updatePurchaseOrderStatus,
} from "@/Controller/purchaseOrderController";

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

// GET /api/purchase-order/:id
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

        return await getOnePurchaseOrder(user, orderId);
    } catch (error) {
        return handleError(error, "Get Purchase Order");
    }
}

// PUT /api/purchase-order/:id
// Update expected delivery date for a draft order
export async function PUT(request, { params }) {
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

        return await updatePurchaseOrder(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error, "Update Purchase Order");
    }
}

// PATCH /api/purchase-order/:id
// Update purchase order status
export async function PATCH(request, { params }) {
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

        return await updatePurchaseOrderStatus(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error, "Update Purchase Order Status");
    }
}
