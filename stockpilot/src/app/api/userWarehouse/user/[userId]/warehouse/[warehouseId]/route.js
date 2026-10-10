export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { removeAssignment } from "@/Controller/userWarehouseController";

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        await authMiddleware(request);

        const { userId, warehouseId } = await params;

        return removeAssignment(
            request,
            userId,
            warehouseId
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