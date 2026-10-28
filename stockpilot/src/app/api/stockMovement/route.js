
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import * as stockMovementController from "@/Controller/stockMovementController";

const allowStockMovement = roleMiddleware(1, 4);

const handleError = (error) => {
    console.error("Stock Movement API Error:", error);

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

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowStockMovement(user);

        return await stockMovementController.createStockMovement(
            request,
            user
        );
    } catch (error) {
        return handleError(error);
    }
}
