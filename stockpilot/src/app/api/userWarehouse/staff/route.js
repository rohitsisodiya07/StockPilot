
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { assignStaff } from "@/Controller/userWarehouseController";

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return assignStaff(request, user);

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
