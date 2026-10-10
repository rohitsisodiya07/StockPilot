export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getOneProduct, updateProduct, deleteProduct, } from "@/Controller/productController";

export async function GET(request, { params }) {
    try {
        await connectDB();
        await authMiddleware(request);

        const { id } = await params;

        return getOneProduct(id);

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

export async function PUT(request, { params }) {
    try {
        await connectDB();
        await authMiddleware(request);

        const { id } = await params;

        return updateProduct(request, id);

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
        await authMiddleware(request);

        const { id } = await params;

        return deleteProduct(id);

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
