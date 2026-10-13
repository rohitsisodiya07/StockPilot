export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import {
    getOneSalesOrder,
    updateSalesOrderStatus,
    dispatchSalesOrder,
} from "@/Controller/salesOrderController";

const parseOrderId = (id) => {
    const orderId = Number(id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return null;
    }

    return orderId;
};

const handleError = (error) => {
    console.error("Sales Order API Error:", error);

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

export async function GET(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return invalidIdResponse();
        }

        return await getOneSalesOrder(user, orderId);
    } catch (error) {
        return handleError(error);
    }
}

export async function PATCH(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return invalidIdResponse();
        }

        return await updateSalesOrderStatus(
            request,
            user,
            orderId
        );
    } catch (error) {
        return handleError(error);
    }
}

export async function POST(request, { params }) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        const { id } = await params;
        const orderId = parseOrderId(id);

        if (orderId === null) {
            return invalidIdResponse();
        }

        return await dispatchSalesOrder(user, orderId);
    } catch (error) {
        return handleError(error);
    }
}