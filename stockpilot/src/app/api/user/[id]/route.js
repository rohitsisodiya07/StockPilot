export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";

import {
    getOneUser,
    updateUser,
    deleteUser,
} from "@/Controller/userController";


// GET /api/user/:id
export async function GET(request, { params }) {

    await connectDB();

    const { id } = await params;

    return getOneUser(id);
}


// PUT /api/user/:id
export async function PUT(request, { params }) {

    await connectDB();

    const { id } = await params;

    return updateUser(request, id);
}


// DELETE /api/user/:id
export async function DELETE(request, { params }) {

    await connectDB();

    const { id } = await params;

    return deleteUser(id);
}