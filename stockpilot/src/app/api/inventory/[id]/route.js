export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { updateInventory, deleteInventory } from "@/Controller/inventoryController";

export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return updateInventory(request, user, id);

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

export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return deleteInventory(user, id);

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
