export const runtime = "nodejs";//Next.js ko batata hai ki is API Route ko Node.js runtime par execute karna hai, Edge Runtime par nahi.

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createProduct,
    getAllProducts,
} from "@/Controller/productController";

export async function POST(request) {
    try {
        await connectDB();

        await authMiddleware(request);

        return createProduct(request);

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

export async function GET(request) {
    try {
        await connectDB();

        await authMiddleware(request);

        return getAllProducts();

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
