export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    createSalesOrderItem,
    getSalesOrderItems,
} from "@/Controller/salesOrderItemController";

const parseOrderId = (id) => {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return null;
    }

    return orderId;
};

const handleError = (error) => {
    console.error("Sales Order Items API Error:", error);

    const isAuthError =
        error?.message === "Invalid or Expired Token";

    return Response.json(
        {
            success: false,
            message: isAuthError
                ? "Invalid or Expired Token"
                : "Internal Server Error",
        },
        { status: isAuthError ? 401 : 500 }
    );
};

const invalidIdResponse = () =>
    Response.json(
        {
            success: false,
            message: "Invalid Sales Order ID",
        },
        { status: 400 }
    );

export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return invalidIdResponse();
        }

        return await createSalesOrderItem(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error);
    }
}

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);

        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return invalidIdResponse();
        }

        return await getSalesOrderItems(user, orderId);
    } catch (error) {
        return handleError(error);
    }
}