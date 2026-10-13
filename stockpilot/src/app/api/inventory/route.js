
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { createInventory } from "@/Controller/inventoryController";

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await createInventory(request, user);
    } catch (error) {
        console.error("Inventory Route Error:", error);

        const isAuthError =
            error.message === "Invalid or Expired Token";

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : "Internal Server Error",
            },
            { status: isAuthError ? 401 : 500 }
        );
    }
}
