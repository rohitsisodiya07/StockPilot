
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getOnePurchaseOrder,
    receivePurchaseOrder,
    updatePurchaseOrderStatus,
} from "@/Controller/purchaseOrderController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await getOnePurchaseOrder(user, Number(id));
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

export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await updatePurchaseOrderStatus(
            request,
            user,
            Number(id)
        );
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

export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await receivePurchaseOrder(user, Number(id));
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
