export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import { removeAssignment } from "@/Controller/userWarehouseController";

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        // Only ADMIN can remove warehouse assignments
        roleMiddleware(1)(user);

        const { userId, warehouseId } = await params;

        return removeAssignment(
            request,
            userId,
            warehouseId
        );
    } catch (error) {
        const isAuthError =
            error?.message === "Invalid or Expired Token";

        const isForbidden =
            error?.message ===
            "Forbidden: You do not have permission";

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : isForbidden
                        ? "Forbidden: You do not have permission"
                        : "Internal Server Error",
            },
            {
                status: isAuthError ? 401 : isForbidden ? 403 : 500,
            }
        );
    }
}