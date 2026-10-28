export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    receivePurchaseOrder,
} from "@/Controller/purchaseOrderController";

export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        if (
            typeof id !== "string" ||
            !/^[1-9]\d*$/.test(id) ||
            !Number.isSafeInteger(Number(id))
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order ID",
                },
                { status: 400 }
            );
        }

        return await receivePurchaseOrder(user, Number(id));
    } catch (error) {
        console.error("Receive Purchase Order Route Error:", error);

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
            { status: isAuthError ? 401 : 500 }
        );
    }
}
