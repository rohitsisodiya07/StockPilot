import * as salesOrderItemService from "@/Service/salesOrderItemService";

const parsePositiveId = (value) => {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
};

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (
        message.includes("Access Denied") ||
        message.includes("Unauthorized")
    ) {
        status = message.includes("Unauthorized") ? 401 : 403;
        responseMessage = message;
    } else if (message.includes("Not Found")) {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Must") ||
        message.includes("Only") ||
        message.includes("Already") ||
        message.includes("Cannot") ||
        message.includes("Exists") ||
        message.includes("Valid") ||
        message.includes("Inactive") ||
        message.includes("Price")
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

// -------------------- Create Sales Order Item --------------------

const createSalesOrderItem = async (request, user, salesOrderId) => {
    try {
        const orderId = parsePositiveId(salesOrderId);

        if (orderId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Sales Order ID",
                },
                { status: 400 }
            );
        }

        let body;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Request Body",
                },
                { status: 400 }
            );
        }

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Request Body",
                },
                { status: 400 }
            );
        }

        const productId = parsePositiveId(body.productId);
        const quantity = Number(body.quantity);
        const unitPrice = Number(body.unitPrice);

        if (
            body.productId === undefined ||
            body.productId === null ||
            body.productId === "" ||
            body.quantity === undefined ||
            body.quantity === null ||
            body.quantity === "" ||
            body.unitPrice === undefined ||
            body.unitPrice === null ||
            body.unitPrice === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Product ID, Quantity and Unit Price Are Required",
                },
                { status: 400 }
            );
        }

        if (productId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Product ID",
                },
                { status: 400 }
            );
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return Response.json(
                {
                    success: false,
                    message: "Quantity Must Be a Positive Integer",
                },
                { status: 400 }
            );
        }

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0 ||
            unitPrice > 99999999.99
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Unit Price Must Be a Valid Non-Negative Amount",
                },
                { status: 400 }
            );
        }

        const data = await salesOrderItemService.createSalesOrderItem(
            user.id,
            user.roleId,
            orderId,
            {
                productId,
                quantity,
                unitPrice,
            }
        );

        return Response.json(
            {
                success: true,
                message: "Sales Order Item Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create Sales Order Item");
    }
};

// -------------------- Get Sales Order Items --------------------

const getSalesOrderItems = async (user, salesOrderId) => {
    const orderId = parsePositiveId(salesOrderId);

    if (orderId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Sales Order ID",
            },
            { status: 400 }
        );
    }

    try {
        const data = await salesOrderItemService.getSalesOrderItems(
            user.id,
            user.roleId,
            orderId
        );

        return Response.json(
            {
                success: true,
                message: "Sales Order Items Fetched Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Sales Order Items");
    }
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
};
