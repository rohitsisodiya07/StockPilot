
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    createUser,
    getAllUsers,
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

// POST: Create User (ADMIN only)
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        return await createUser(request);
    } catch (error) {
        return handleError(error, "Create");
    }
}

// GET: Get All Users (ADMIN only)
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        return await getAllUsers();
    } catch (error) {
        return handleError(error, "Fetch");
    }
}
