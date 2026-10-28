
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneCategory,
    updateCategory,
    deactivateCategory,
} from "@/Controller/categoryController";

const allowCategoryAccess = roleMiddleware(1, 4);

// Error Handler
const handleRouteError = (error, action) => {
    console.error(`${action} Category API Error:`, error);

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

// GET: Fetch One Category
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowCategoryAccess(user);

        const { id } = await params;

        return await getOneCategory(id);
    } catch (error) {
        return handleRouteError(error, "Fetch");
    }
}

// PUT: Update Category
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowCategoryAccess(user);

        const { id } = await params;

        return await updateCategory(request, id);
    } catch (error) {
        return handleRouteError(error, "Update");
    }
}

// DELETE: Deactivate Category
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowCategoryAccess(user);

        const { id } = await params;

        return await deactivateCategory(id);
    } catch (error) {
        return handleRouteError(error, "Deactivate");
    }
}
