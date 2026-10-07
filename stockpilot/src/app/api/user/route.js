export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import {
    createUser,
    getAllUsers,
} from "@/Controller/userController";

import authMiddleware from "@/Middleware/authMiddleware";


// POST - Create User
export async function POST(request) {

    await connectDB();

    return createUser(request);
}


// GET - Get All Users
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        console.log(user.id);
        console.log(user.roleId);

        return getAllUsers();

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