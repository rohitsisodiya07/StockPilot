
import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getWarehouseSalesSummary } from "@/Controller/reportController";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getWarehouseSalesSummary(request, user);
    } catch (error) {
        const statusCode =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
}
