export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { createInventory } from "@/Controller/inventoryController";

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return createInventory(request, user);

    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 401 }
        );
    }
}
