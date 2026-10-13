export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createSalesOrder,
    getAllSalesOrders,
} from "@/Controller/salesOrderController";

const handleError = (error) => {
    console.error("Sales Order API Error:", error);

    const isAuthError =
        error?.message === "Invalid or Expired Token";

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

        return await createSalesOrder(request, user);
    } catch (error) {
        return handleError(error);
    }
}

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getAllSalesOrders(request, user);
    } catch (error) {
        return handleError(error);
    }
}