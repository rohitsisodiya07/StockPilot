
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    deletePurchaseOrderItem,
} from "@/Controller/purchaseOrderItemController";

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id, itemId } = await params;

        if (
            !/^[1-9]\d*$/.test(id) ||
            !Number.isSafeInteger(Number(id)) ||
            !/^[1-9]\d*$/.test(itemId) ||
            !Number.isSafeInteger(Number(itemId))
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order or Item ID",
                },
                { status: 400 }
            );
        }

        return await deletePurchaseOrderItem(
            user,
            Number(id),
            Number(itemId)
        );
    } catch (error) {
        console.error("Delete Purchase Order Item Route Error:", error);

        const isAuthError =
            error?.message === "Invalid or Expired Token" ||
            error?.message === "Unauthorized";

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? error.message
                    : "Internal Server Error",
            },
            { status: isAuthError ? 401 : 500 }
        );
    }
}
