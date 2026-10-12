export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import { getOneSalesOrder, updateSalesOrderStatus, dispatchSalesOrder } from "@/Controller/salesOrderController";

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await getOneSalesOrder(user, Number(id));
    }
    catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }

}


export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await updateSalesOrderStatus(
            request,
            user,
            Number(id)
        );
    }
    catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }

}


export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;

        return await dispatchSalesOrder(user, Number(id));
    }
    catch (error) {
        const status =
            error.message === "Invalid or Expired Token" ? 401 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }

}
