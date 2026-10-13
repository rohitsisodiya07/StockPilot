export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import {
    createUser,
    getAllUsers,
} from "@/Controller/userController";

import authMiddleware from '@/Middleware/authMiddleware'


// POST - Create User
export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        if (user.roleId !== 1) {
            return Response.json(
                {
                    success: false,
                    message: "Forbidden: Admin Access Required",
                },
                { status: 403 }
            );
        }

        return await createUser(request);

    } catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
}


// GET - Get All Users
export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        if (user.roleId !== 1) {
            return Response.json(
                {
                    success: false,
                    message: "Forbidden: Admin Access Required",
                },
                { status: 403 }
            );
        }

        return await getAllUsers();

    } catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
}