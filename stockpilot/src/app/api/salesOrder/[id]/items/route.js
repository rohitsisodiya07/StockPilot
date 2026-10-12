export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createSalesOrderItem,
    getSalesOrderItems,
} from "@/Controller/salesOrderItemController";

export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await createSalesOrderItem(request, user, Number(id));
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 401 }
        );
    }
}

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await getSalesOrderItems(user, Number(id));
    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 401 }
        );
    }
}
