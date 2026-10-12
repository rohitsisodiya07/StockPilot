import * as salesOrderItemService from "@/Service/salesOrderItemService";

const createSalesOrderItem = async (request, user, salesOrderId) => {
    try {
        const body = await request.json();

        const data = await salesOrderItemService.createSalesOrderItem(
            user.id,
            user.roleId,
            Number(salesOrderId),
            {
                productId: Number(body.productId),
                quantity: Number(body.quantity),
                unitPrice: body.unitPrice === undefined
                    ? undefined
                    : Number(body.unitPrice),
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
        const status =
            error.message.includes("Access Denied") ? 403 :
            error.message.includes("Not Found") ? 404 :
            error.message.includes("Required") ||
            error.message.includes("Valid") ||
            error.message.includes("Only") ||
            error.message.includes("Inactive") ? 400 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};

const getSalesOrderItems = async (user, salesOrderId) => {
    try {
        const data = await salesOrderItemService.getSalesOrderItems(
            user.id,
            user.roleId,
            Number(salesOrderId)
        );

        return Response.json({
            success: true,
            message: "Sales Order Items Fetched Successfully",
            data,
        });
    } catch (error) {
        const status =
            error.message.includes("Access Denied") ? 403 :
            error.message.includes("Not Found") ? 404 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};

export {
    createSalesOrderItem,
    getSalesOrderItems,
};
