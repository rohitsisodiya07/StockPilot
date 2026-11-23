export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import { removeAssignment } from "@/Controller/userWarehouseController";

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        // Admin and Inventory Manager
        roleMiddleware(1, 4)(user);

        const { userId, warehouseId } = await params;

        return await removeAssignment(
            request,
            user,
            userId,
            warehouseId
        );

    } catch (error) {
        const isAuthError =
            error?.message === "Invalid or Expired Token";

        const isForbidden =
            error?.message === "Forbidden: You do not have permission";

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            {
                status: isAuthError ? 401 : isForbidden ? 403 : 500,
            }
        );
    }
}