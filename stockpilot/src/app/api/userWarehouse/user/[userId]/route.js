export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getUserWarehouses } from "@/Controller/userWarehouseController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { userId } = await params;

        const requestedUserId = Number(userId);

        if (
            !Number.isInteger(requestedUserId) ||
            requestedUserId <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid User ID",
                },
                { status: 400 }
            );
        }

        // Admin can view any user's warehouse assignments.
        // Other users can view only their own assignments.
        if (
            Number(user.roleId) !== 1 &&
            Number(user.id) !== requestedUserId
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Forbidden: You do not have permission",
                },
                { status: 403 }
            );
        }

        return await getUserWarehouses(request, requestedUserId);
    } catch (error) {
        console.error("Get User Warehouses Route Error:", error);

        const isAuthError =
            error?.message === "Invalid or Expired Token";

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : "Internal Server Error",
            },
            { status: isAuthError ? 401 : 500 }
        );
    }
}