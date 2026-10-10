import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as stockMovementController from "@/Controller/stockMovementController";

export const runtime = "nodejs";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        const { inventoryId } = await params;

        return await stockMovementController.getInventoryMovements(
            user,
            inventoryId
        );
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
