export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getOneRole,
    updateRole,
    deleteRole,
} from "@/Controller/roleController";

const authorizeAdmin = async (request) => {
    const user = await authMiddleware(request);

    if (Number(user.roleId) !== 1) {
        throw new Error("Access Denied: Admin Only");
    }
};

const handleError = (error) => {
    console.error("Role API Error:", error);

    const isAuthError =
        error?.message === "Invalid or Expired Token";

    const isForbidden =
        error?.message?.includes("Access Denied");

    return Response.json(
        {
            success: false,
            message: isAuthError
                ? "Invalid or Expired Token"
                : isForbidden
                    ? error.message
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

export async function GET(request, { params }) {
    try {
        await connectDB();
        await authorizeAdmin(request);

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

export async function PUT(request, { params }) {
    try {
        await connectDB();
        await authorizeAdmin(request);

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

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        await authorizeAdmin(request);

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