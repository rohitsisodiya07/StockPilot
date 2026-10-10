export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getUserWarehouses } from "@/Controller/userWarehouseController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        await authMiddleware(request);

        const { userId } = await params;

        return getUserWarehouses(request, userId);

    } catch (error) {
        console.error("Get User Warehouses Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 401 }
        );
    }
}