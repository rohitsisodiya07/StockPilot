
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    createWarehouse,
    getAllWarehouses,
} from "@/Controller/warehouseController";

const allowWarehouseRead = roleMiddleware(1, 4, 5);
const allowWarehouseCreate = roleMiddleware(1);

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

// GET: Fetch all warehouses
export async function GET(request) {
    try {
        const user = await authMiddleware(request);
        allowWarehouseRead(user);

        await connectDB();
        return await getAllWarehouses(user);
    } catch (error) {
        return handleError(error, "Fetch");
    }
}

// POST: Create warehouse
export async function POST(request) {
    try {
        const user = await authMiddleware(request);
        allowWarehouseCreate(user);

        await connectDB();
        return await createWarehouse(request);
    } catch (error) {
        return handleError(error, "Create");
    }
}
