
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from "@/Controller/warehouseController";

const allowWarehouseRead = roleMiddleware(1, 4, 5);
const allowWarehouseUpdate = roleMiddleware(1, 4);
const allowWarehouseDelete = roleMiddleware(1);

const handleError = (error, action) => {
    const isAuthError =
        error?.message === "Invalid or Expired Token" ||
        error?.name === "JsonWebTokenError" ||
        error?.name === "TokenExpiredError";

    const isForbidden =
        error?.message === "Forbidden: You do not have permission" ||
        error?.status === 403 ||
        error?.statusCode === 403;

    if (!isAuthError && !isForbidden) {
        console.error(`Warehouse ${action} API Error:`, error);
    }

    return Response.json(
        {
            success: false,
            message: isAuthError
                ? "Invalid or Expired Token"
                : isForbidden
                    ? error?.message || "Forbidden: You do not have permission"
                    : "Internal Server Error",
        },
        {
            status: isAuthError ? 401 : isForbidden ? 403 : 500,
        }
    );
};

// GET: Fetch One Warehouse
export async function GET(request, { params }) {
    try {
        const user = await authMiddleware(request);
        allowWarehouseRead(user);

        await connectDB();
        const { id } = await params;

        return await getOneWarehouse(id);
    } catch (error) {
        return handleError(error, "Fetch");
    }
}

// PUT: Update Warehouse
export async function PUT(request, { params }) {
    try {
        const user = await authMiddleware(request);
        allowWarehouseUpdate(user);

        await connectDB();
        const { id } = await params;

        return await updateWarehouse(request, id);
    } catch (error) {
        return handleError(error, "Update");
    }
}

// DELETE: Delete Warehouse
export async function DELETE(request, { params }) {
    try {
        const user = await authMiddleware(request);
        allowWarehouseDelete(user);

        await connectDB();
        const { id } = await params;

        return await deleteWarehouse(id);
    } catch (error) {
        return handleError(error, "Delete");
    }
}
