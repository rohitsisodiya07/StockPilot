
import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as inventoryController from "@/Controller/inventoryController";

export const runtime = "nodejs";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { warehouseId } = await params;

        return await inventoryController.getLowStockInventory(
            user,
            warehouseId
        );
    } catch (error) {
        console.error("Low Stock Route Error:", error);

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
