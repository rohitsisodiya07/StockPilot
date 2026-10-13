
export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import { loginUser } from "@/Controller/userController";

export async function POST(request) {
    try {
        await connectDB();

        return await loginUser(request);
    } catch (error) {
        console.error("Login Route Error:", error.message);

        return Response.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
