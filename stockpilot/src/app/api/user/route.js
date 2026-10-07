export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import {
    createUser,
    getAllUsers,
} from "@/Controller/userController";


// POST - Create User
export async function POST(request) {

    await connectDB();

    return createUser(request);
}


// GET - Get All Users
export async function GET() {

    await connectDB();

    return getAllUsers();
}