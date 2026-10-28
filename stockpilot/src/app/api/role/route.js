
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    createRole,
    getAllRoles,
} from "@/Controller/roleController";

const allowAdminAccess = roleMiddleware(1);

const handleError = (error) => {
    console.error("Role API Error:", error);

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
                    ? "Access Denied: Admin Only"
                    : "Internal Server Error",
        },
        {
            status: isAuthError ? 401 : isForbidden ? 403 : 500,
        }
    );
};

// POST: Create Role (ADMIN only)
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        return await createRole(request);
    } catch (error) {
        return handleError(error);
    }
}

// GET: Fetch All Roles (ADMIN only)
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        return await getAllRoles();
    } catch (error) {
        return handleError(error);
    }
}
