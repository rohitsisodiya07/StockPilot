
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    createWarehouse,
    getAllWarehouses,
} from "@/Controller/warehouseController";

const allowWarehouseRead = roleMiddleware(1, 4, 5);
const allowWarehouseCreate = roleMiddleware(1, 4);

const handleError = (error, action) => {
    console.error(`Warehouse ${action} API Error:`, error);

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

// POST: Create Warehouse
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWarehouseCreate(user);

        return await createWarehouse(request);
    } catch (error) {
        return handleError(error, "Create");
    }
}

// GET: Fetch All Warehouses
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWarehouseRead(user);

        return await getAllWarehouses();
    } catch (error) {
        return handleError(error, "Fetch");
    }
}
