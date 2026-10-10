import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as dashboardController from "@/Controller/dashboardController";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await dashboardController.getDashboardAnalytics(user);
    } catch (error) {
        return Response.json(
            { success: false, message: error.message },
            { status: 401 }
        );
    }
}
