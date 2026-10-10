import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as stockMovementController from "@/Controller/stockMovementController";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);

        return await stockMovementController.createStockMovement(
            request,
            user
        );
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
