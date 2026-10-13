
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getOnePurchaseOrder,
    receivePurchaseOrder,
    updatePurchaseOrderStatus,
} from "@/Controller/purchaseOrderController";

const handleError = (error, action) => {
    console.error(`${action} Route Error:`, error);

    const isAuthError =
        error.message === "Invalid or Expired Token";

    return Response.json(
        {
            success: false,
            message: isAuthError
                ? "Invalid or Expired Token"
                : "Internal Server Error",
        },
        { status: isAuthError ? 401 : 500 }
    );
};

const parseOrderId = (id) => {
    const orderId = Number(id);

    return Number.isInteger(orderId) && orderId > 0
        ? orderId
        : null;
};

export async function GET(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return Response.json(
                { success: false, message: "Invalid Purchase Order ID" },
                { status: 400 }
            );
        }

        return await getOnePurchaseOrder(user, orderId);
    } catch (error) {
        return handleError(error, "Get Purchase Order");
    }
}

export async function PATCH(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return Response.json(
                { success: false, message: "Invalid Purchase Order ID" },
                { status: 400 }
            );
        }

        return await updatePurchaseOrderStatus(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error, "Update Purchase Order");
    }
}

export async function POST(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return Response.json(
                { success: false, message: "Invalid Purchase Order ID" },
                { status: 400 }
            );
        }

        return await receivePurchaseOrder(user, orderId);
    } catch (error) {
        return handleError(error, "Receive Purchase Order");
    }
}
