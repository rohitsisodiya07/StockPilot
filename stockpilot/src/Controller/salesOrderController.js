import * as salesOrderService from "@/Service/salesOrderService";

const createSalesOrder = async (request, user) => {
    try {
        const body = await request.json();

        const data = await salesOrderService.createSalesOrder(
            user.id,
            user.roleId,
            {
                warehouseId: Number(body.warehouseId),
                customerName: body.customerName,
                customerEmail: body.customerEmail,
            }
        );

        return Response.json(
            {
                success: true,
                message: "Sales Order Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message.includes("Not Found") ? 404 :
                    error.message.includes("Required") ? 400 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};


const getAllSalesOrders = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const data = await salesOrderService.getAllSalesOrders(
            user.id,
            user.roleId,
            status
        );

        return Response.json({
            success: true,
            message: "Sales Orders Fetched Successfully",
            data,
        });
    } catch (error) {
        const statusCode =
            error.message === "Invalid Sales Order Status" ? 400 : 500;

        return Response.json({
            success: false,
            message: error.message,
        }, { status: statusCode });
    }
};


const getOneSalesOrder = async (user, id) => {
    try {
        const data = await salesOrderService.getOneSalesOrder(
            user.id,
            user.roleId,
            id
        );

        return Response.json({
            success: true,
            message: "Sales Order Fetched Successfully",
            data,
        });
    } catch (error) {
        const status =
            error.message === "Sales Order Not Found" ? 404 :
                error.message.includes("Access Denied") ? 403 : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};


const updateSalesOrderStatus = async (request, user, id) => {
    try {
        const body = await request.json();

        const data = await salesOrderService.updateSalesOrderStatus(
            user.id,
            user.roleId,
            Number(id),
            body.status
        );

        return Response.json({
            success: true,
            message: "Sales Order Status Updated Successfully",
            data,
        });
    } catch (error) {
        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message.includes("Not Found") ? 404 :
                    error.message.includes("Invalid") ||
                        error.message.includes("Only") ||
                        error.message.includes("Without Items") ? 400 : 500;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};


const dispatchSalesOrder = async (user, id) => {
    try {
        const data = await salesOrderService.dispatchSalesOrder(
            user.id,
            user.roleId,
            Number(id)
        );

        return Response.json({
            success: true,
            message: "Sales Order Dispatched Successfully",
            data,
        });
    } catch (error) {
        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message.includes("Not Found") ? 404 :
                    error.message.includes("Only") ||
                        error.message.includes("Without Items") ||
                        error.message.includes("Insufficient Stock") ? 400 : 500;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};


export {
    createSalesOrder,
    getAllSalesOrders,
    getOneSalesOrder,
    updateSalesOrderStatus,
    dispatchSalesOrder
};
