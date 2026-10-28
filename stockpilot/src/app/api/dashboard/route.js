
import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import * as dashboardController from "@/Controller/dashboardController";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { searchParams } = new URL(request.url);

        const filters = {
            warehouseId: searchParams.get("warehouseId"),
            userId: searchParams.get("userId"),
            activityRoleId: searchParams.get("activityRoleId"),
            startDate: searchParams.get("startDate"),
            endDate: searchParams.get("endDate"),

            // Pagination for stock movement history
            page: searchParams.get("page") ?? "1",
            limit: searchParams.get("limit") ?? "10",
        };

        return await dashboardController.getDashboardAnalytics(
            user,
            filters
        );
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
            { status: isAuthError ? 401 : 500 }
        );
    }
}
