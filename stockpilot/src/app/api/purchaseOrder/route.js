
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getAllPurchaseOrders,
    createPurchaseOrder,
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

export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        return await createPurchaseOrder(request, user);
    } catch (error) {
        return handleError(error, "Create Purchase Order");
    }
}

export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        return await getAllPurchaseOrders(user);
    } catch (error) {
        return handleError(error, "Get Purchase Orders");
    }
}
