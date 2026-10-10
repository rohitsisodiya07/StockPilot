import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as supplierController from "@/Controller/supplierController";

export const runtime = "nodejs";

export async function GET(request, { params }) {
    try {
        await connectDB();
        await authMiddleware(request);
        const { id } = await params;
        return await supplierController.getOneSupplier(id);
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        await connectDB();
        await authMiddleware(request);
        const { id } = await params;
        return await supplierController.updateSupplier(request, id);
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        await connectDB();
        await authMiddleware(request);
        const { id } = await params;
        return await supplierController.deleteSupplier(id);
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
