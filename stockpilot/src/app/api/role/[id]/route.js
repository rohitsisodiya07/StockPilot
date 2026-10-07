export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import { getOneRole, updateRole, deleteRole } from "@/Controller/roleController";

export async function GET(request, { params }) {
    await connectDB();

    const { id } = await params;

    return getOneRole(id);
}

export async function PUT(request, { params }) {
    await connectDB();

    const { id } = await params;

    return updateRole(request, id);
}

export async function DELETE(request, { params }) {
    await connectDB();

    const { id } = await params;

    return deleteRole(id);
}