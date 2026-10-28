
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneUser,
    updateUser,
    deleteUser,
} from "@/Controller/userController";

const allowAdminAccess = roleMiddleware(1);

const handleError = (error, action) => {
    console.error(`User ${action} API Error:`, error);

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
                    ? "Forbidden: Admin Access Required"
                    : "Internal Server Error",
        },
        {
            status: isAuthError ? 401 : isForbidden ? 403 : 500,
        }
    );
};

// GET: Fetch One User (ADMIN only)
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await getOneUser(id);
    } catch (error) {
        return handleError(error, "Fetch");
    }
}

// PUT: Update User (ADMIN only)
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await updateUser(request, id);
    } catch (error) {
        return handleError(error, "Update");
    }
}

// DELETE: Delete User (ADMIN only)
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await deleteUser(id);
    } catch (error) {
        return handleError(error, "Delete");
    }
}
