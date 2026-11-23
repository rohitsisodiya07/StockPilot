
import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";

import {
    updateStaffByManager,
    deleteStaffByManager
} from "@/Controller/userController";

export const runtime = "nodejs";


// UPDATE STAFF
export async function PUT(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        const { staffId } = await params;

        return await updateStaffByManager(
            request,
            user,
            staffId
        );

    } catch (error) {
        console.error("Update Staff Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message
            },
            { status: 401 }
        );
    }
}


// DELETE STAFF
export async function DELETE(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        const { staffId } = await params;

        const { searchParams } = new URL(request.url);

        const warehouseId = searchParams.get("warehouseId");

        return await deleteStaffByManager(
            user,
            staffId,
            warehouseId
        );

    } catch (error) {
        console.error("Delete Staff Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message
            },
            { status: 401 }
        );
    }
}
