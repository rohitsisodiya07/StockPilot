export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import { loginUser } from "@/Controller/userController";

export async function POST(request) {
    await connectDB();

    return loginUser(request);
}