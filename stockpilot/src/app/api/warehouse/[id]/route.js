export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import {
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from "@/Controller/warehouseController";

export async function GET(request, { params }) {
    await connectDB();

    const { id } = await params;

    return getOneWarehouse(id);
}

export async function PUT(request, { params }) {
    await connectDB();

    const { id } = await params;

    return updateWarehouse(request, id);
}

export async function DELETE(request, { params }) {
    await connectDB();

    const { id } = await params;

    return deleteWarehouse(id);
}