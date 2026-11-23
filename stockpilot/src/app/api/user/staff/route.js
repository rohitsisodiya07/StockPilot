
import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";

import {
    createStaffByManager,
    getManagerStaff
} from "@/Controller/userController";

export const runtime = "nodejs";

// CREATE STAFF
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await createStaffByManager(request, user);

    } catch (error) {
        console.error("Create Staff Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message
            },
            { status: 401 }
        );
    }
}


// GET MANAGER'S STAFF
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getManagerStaff(user);

    } catch (error) {
        console.error("Get Staff Route Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message
            },
            { status: 401 }
        );
    }
}
