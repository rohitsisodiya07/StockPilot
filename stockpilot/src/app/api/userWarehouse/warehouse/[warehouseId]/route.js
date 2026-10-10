export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getWarehouseUsers } from "@/Controller/userWarehouseController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        await authMiddleware(request);

        const { warehouseId } = await params;

        return getWarehouseUsers(request, warehouseId);

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