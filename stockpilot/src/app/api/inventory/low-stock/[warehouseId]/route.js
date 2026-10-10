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
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
