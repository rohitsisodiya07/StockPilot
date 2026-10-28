
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import {
    createInventory,
    getAllInventory,
} from "@/Controller/inventoryController";

const allowInventoryRead = roleMiddleware(1, 4, 5);
const allowInventoryCreate = roleMiddleware(1, 4);

const handleError = (error) => {
    console.error("Inventory Route Error:", error);

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

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowInventoryRead(user);

        return await getAllInventory(user);
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowInventoryCreate(user);

        return await createInventory(request, user);
    } catch (error) {
        return handleError(error);
    }
}
