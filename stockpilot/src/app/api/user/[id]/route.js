export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";

import {
    getOneUser,
    updateUser,
    deleteUser,
} from "@/Controller/userController";

const authorizeAdmin = async (request) => {
    const user = await authMiddleware(request);

    if (user.roleId !== 1) {
        return {
            allowed: false,
            response: Response.json(
                {
                    success: false,
                    message: "Forbidden: Admin Access Required",
                },
                { status: 403 }
            ),
        };
    }

    return { allowed: true, user };
};

export async function GET(request, { params }) {
    try {
        await connectDB();

        const auth = await authorizeAdmin(request);
        if (!auth.allowed) return auth.response;

        const { id } = await params;
        return await getOneUser(id);
    } catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const auth = await authorizeAdmin(request);
        if (!auth.allowed) return auth.response;

        const { id } = await params;
        return await updateUser(request, id);
    } catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const auth = await authorizeAdmin(request);
        if (!auth.allowed) return auth.response;

        const { id } = await params;
        return await deleteUser(id);
    } catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
}