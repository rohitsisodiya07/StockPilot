
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
        console.error("Dashboard Route Error:", error);

        const isAuthError =
            error.message === "Invalid or Expired Token";

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : "Internal Server Error",
            },
            {
                status: isAuthError ? 401 : 500,
            }
        );
    }
}
