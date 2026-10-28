
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
} from "@/Controller/supplierController";

const allowRead = roleMiddleware(1, 4, 5);
const allowWrite = roleMiddleware(1, 4);

const handleRouteError = (error, action) => {
    console.error(`${action} Supplier API Error:`, error);

    const isAuthError =
        error?.message === "Invalid or Expired Token";

    const isForbidden =
        error?.message === "Forbidden: You do not have permission";

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

// GET: Fetch one supplier
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowRead(user);

        const { id } = await params;

        return await getOneSupplier(id);
    } catch (error) {
        return handleRouteError(error, "Fetch One");
    }
}

// PUT: Update supplier
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWrite(user);

        const { id } = await params;

        return await updateSupplier(request, id);
    } catch (error) {
        return handleRouteError(error, "Update");
    }
}

// DELETE: Soft delete / deactivate supplier
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWrite(user);

        const { id } = await params;

        return await deleteSupplier(id);
    } catch (error) {
        return handleRouteError(error, "Deactivate");
    }
}
