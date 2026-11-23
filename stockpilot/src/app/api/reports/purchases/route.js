import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getPurchaseSummary } from "@/Controller/reportController";
import handleReportRouteError from "@/Utils/reportRouteError";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        return await getPurchaseSummary(request, user);
    } catch (error) {
        return handleReportRouteError(error);
    }
}