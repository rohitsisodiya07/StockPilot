export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createRole,
    getAllRoles,
} from "@/Controller/roleController";

const authorizeAdmin = async (request) => {
    const user = await authMiddleware(request);

    if (Number(user.roleId) !== 1) {
        throw new Error("Access Denied: Admin Only");
    }

    return user;
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

export async function POST(request) {
    try {
        await connectDB();
        await authorizeAdmin(request);

        return await createRole(request);
    } catch (error) {
        return handleError(error);
    }
}

export async function GET(request) {
    try {
        await connectDB();
        await authorizeAdmin(request);

        return await getAllRoles();
    } catch (error) {
        return handleError(error);
    }
}
