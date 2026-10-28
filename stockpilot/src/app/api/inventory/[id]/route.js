
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getInventoryById,
    updateInventory,
    deleteInventory,
} from "@/Controller/inventoryController";

const allowInventoryAccess = roleMiddleware(1, 4);

const handleError = (error, action) => {
    console.error(`Inventory ${action} Route Error:`, error);

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

// PATCH: Update Inventory
export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowInventoryAccess(user);

        const { id } = await params;

        return await updateInventory(request, user, id);
    } catch (error) {
        return handleError(error, "Update");
    }
}

// DELETE: Delete Inventory
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowInventoryAccess(user);

        const { id } = await params;

        return await deleteInventory(user, id);
    } catch (error) {
        return handleError(error, "Delete");
    }
}

// GET: Inventory by ID
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        roleMiddleware(1, 4, 5)(user);

        const { id } = await params;

        return await getInventoryById(user, id);
    } catch (error) {
        return handleError(error, "Fetch");
    }
}
