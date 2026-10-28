export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import {
    createCategory,
    getAllCategories,
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

// POST: Create Category
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowCategoryAccess(user);

        return await createCategory(request);
    } catch (error) {
        return handleRouteError(error, "Create");
    }
}

// GET: Fetch Categories
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowCategoryAccess(user);

        return await getAllCategories(request);
    } catch (error) {
        return handleRouteError(error, "Fetch");
    }
}
