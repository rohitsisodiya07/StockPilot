export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import { createRole, getAllRoles } from "@/Controller/roleController";

export async function POST(request) {
    await connectDB();

    return createRole(request);
}

export async function GET() {
    await connectDB();

    return getAllRoles();
}