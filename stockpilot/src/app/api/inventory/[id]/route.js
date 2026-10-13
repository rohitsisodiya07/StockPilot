
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    updateInventory,
    deleteInventory,
} from "@/Controller/inventoryController";

const handleError = (error, action) => {
    console.error(`Inventory ${action} Route Error:`, error);

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
};

export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await updateInventory(request, user, id);
    } catch (error) {
        return handleError(error, "Update");
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await deleteInventory(user, id);
    } catch (error) {
        return handleError(error, "Delete");
    }
}
