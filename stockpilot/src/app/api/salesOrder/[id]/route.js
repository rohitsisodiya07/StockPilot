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

    const message = error?.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (message === "Invalid or Expired Token") {
        status = 401;
        responseMessage = message;
    } else if (message.includes("Access Denied")) {
        status = 403;
        responseMessage = message;
    } else if (message.includes("Not Found")) {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Invalid") ||
        message.includes("Required") ||
        message.includes("Only") ||
        message.includes("Cannot") ||
        message.includes("Without Items") ||
        message.includes("Insufficient Stock") ||
        message.includes("Must") ||
        message.includes("Use Dispatch Endpoint") ||
        message.includes("Valid") ||
        message.includes("Already") ||
        message.includes("Exists")
    ) {
        status = 400;
        responseMessage = message;
    }

    return Response.json(
        {
            success: false,
            message: responseMessage,
        },
        { status }
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