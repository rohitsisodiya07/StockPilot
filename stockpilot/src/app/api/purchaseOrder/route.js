
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";

import {
    getAllPurchaseOrders,
    createPurchaseOrder,
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

// POST /api/purchase-order
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await createPurchaseOrder(request, user);
    } catch (error) {
        return handleError(error, "Create Purchase Order");
    }
}

// GET /api/purchase-order
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        // Pass request so the controller can read query parameters
        return await getAllPurchaseOrders(request, user);
    } catch (error) {
        return handleError(error, "Get Purchase Orders");
    }
}
