
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import { getWarehouseDetails } from "@/Controller/warehouseController";

const allowWarehouseRead = roleMiddleware(1, 4, 5);

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowWarehouseRead(user);

        const { id } = await params;

        if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Warehouse ID",
                },
                { status: 400 }
            );
        }

        return await getWarehouseDetails(Number(id));
    } catch (error) {
        console.error("Warehouse Details API Error:", error);

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
    }
}
