export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createSalesOrder,
    getAllSalesOrders,
} from "@/Controller/salesOrderController";

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await createSalesOrder(request, user);
    }
    catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }

}

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getAllSalesOrders(request, user);
    }
    catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }

}
