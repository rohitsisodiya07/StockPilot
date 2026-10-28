export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    getOneProduct,
    updateProduct,
    deleteProduct,
} from "@/Controller/productController";

const allowProductAccess = roleMiddleware(1, 4);

// Error Handler
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

// GET: Fetch One Product
export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowProductAccess(user);

        const { id } = await params;

        return await getOneProduct(id);
    } catch (error) {
        return handleRouteError(error, "Get");
    }
}

// PUT: Update Product
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowProductAccess(user);

        const { id } = await params;

        return await updateProduct(request, id);
    } catch (error) {
        return handleRouteError(error, "Update");
    }
}

// DELETE: Deactivate Product
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowProductAccess(user);

        const { id } = await params;

        return await deleteProduct(id);
    } catch (error) {
        return handleRouteError(error, "Deactivate");
    }
}
