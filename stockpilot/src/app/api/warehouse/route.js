export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import {
    createWarehouse,
    getAllWarehouses,
} from "@/Controller/warehouseController";

export async function POST(request) {
    await connectDB();

    return createWarehouse(request);
}

export async function GET() {
    await connectDB();

    return getAllWarehouses();
}