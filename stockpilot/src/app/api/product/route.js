
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import {
    createProduct,
    getAllProducts,
} from "@/Controller/productController";

const allowProductAccess = roleMiddleware(1, 4);

const handleRouteError = (error, action) => {
    console.error(`${action} Product API Error:`, error);

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

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowProductAccess(user);

        return await createProduct(request);
    } catch (error) {
        return handleRouteError(error, "Create");
    }
}

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowProductAccess(user);

        return await getAllProducts(request);
    } catch (error) {
        return handleRouteError(error, "Fetch");
    }
}
