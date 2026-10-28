
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";

import {
    createSupplier,
    getAllSuppliers,
} from "@/Controller/supplierController";

const allowRead = roleMiddleware(1, 4, 5);
const allowWrite = roleMiddleware(1, 4);

const handleRouteError = (error, action) => {
    console.error(`${action} Supplier API Error:`, error);

    const isAuthError =
        error?.message === "Invalid or Expired Token";

    const isForbidden =
        error?.message === "Forbidden: You do not have permission";

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

// GET: List, search, filter, sort and paginate suppliers
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowRead(user);

        return await getAllSuppliers(request);
    } catch (error) {
        return handleRouteError(error, "Fetch");
    }
}

// POST: Create supplier
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWrite(user);

        return await createSupplier(request);
    } catch (error) {
        return handleRouteError(error, "Create");
    }
}
