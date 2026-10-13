
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getWarehouseInventory } from "@/Controller/inventoryController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { warehouseId } = await params;

        return await getWarehouseInventory(user, warehouseId);
    } catch (error) {
        console.error("Warehouse Inventory Route Error:", error);

        const isAuthError =
            error.message === "Invalid or Expired Token";

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
