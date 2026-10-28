
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneRole,
    updateRole,
    deleteRole,
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

const getRoleId = (id) => {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid Role ID");
    }

    return roleId;
};

// GET: Fetch One Role
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await getOneRole(getRoleId(id));
    } catch (error) {
        if (error?.message === "Invalid Role ID") {
            return Response.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return handleError(error);
    }
}

// PUT: Update Role
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await updateRole(request, getRoleId(id));
    } catch (error) {
        if (error?.message === "Invalid Role ID") {
            return Response.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return handleError(error);
    }
}

// DELETE: Delete Role
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowAdminAccess(user);

        const { id } = await params;

        return await deleteRole(getRoleId(id));
    } catch (error) {
        if (error?.message === "Invalid Role ID") {
            return Response.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return handleError(error);
    }
}
