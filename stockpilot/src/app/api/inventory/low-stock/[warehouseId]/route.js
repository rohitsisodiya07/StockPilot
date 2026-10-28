
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import * as inventoryController from "@/Controller/inventoryController";

const allowLowStockAccess = roleMiddleware(1, 4, 5);

const handleError = (error) => {
    console.error("Low Stock Route Error:", error);

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
};

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowLowStockAccess(user);

        const { warehouseId } = await params;

        return await inventoryController.getLowStockInventory(
            user,
            warehouseId
        );
    } catch (error) {
        return handleError(error);
    }
}
