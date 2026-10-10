export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as supplierController from "@/Controller/supplierController";

export async function POST(request) {
    try {
        await connectDB();
        await authMiddleware(request);
        return await supplierController.createSupplier(request);
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}

export async function GET(request) {
    try {
        await connectDB();
        await authMiddleware(request);
        return await supplierController.getAllSuppliers();
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
