export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as purchaseOrderItemController from "@/Controller/purchaseOrderItemController";


export async function POST(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        const { id } = await params;

        return await purchaseOrderItemController.createPurchaseOrderItem(
            request,
            user,
            id
        );
    } catch (error) {
        const status = error.message.includes("Token") ||
            error.message.includes("Authorization") ||
            error.message.includes("JWT") ? 401 : 500;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
}

export async function GET(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        const { id } = await params;

        return await purchaseOrderItemController.getPurchaseOrderItems(
            user,
            id
        );
    } catch (error) {
        const status = error.message.includes("Token") ||
            error.message.includes("Authorization") ||
            error.message.includes("JWT") ? 401 : 500;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
}
