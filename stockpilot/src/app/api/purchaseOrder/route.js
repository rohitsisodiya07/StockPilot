
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getAllPurchaseOrders,
    createPurchaseOrder,
} from "@/Controller/purchaseOrderController";

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await createPurchaseOrder(request, user);
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

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getAllPurchaseOrders(user);
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
