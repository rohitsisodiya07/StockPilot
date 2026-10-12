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
        const search = searchParams.get("search");
        const page = searchParams.get("page") || 1;
        const limit = searchParams.get("limit") || 10;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const sortOrder = searchParams.get("sortOrder") || "DESC";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const warehouseId = searchParams.get("warehouseId");

        const result = await salesOrderService.getAllSalesOrders(
            user.id,
            user.roleId,
            status,
            search,
            page,
            limit,
            startDate,
            endDate,
            sortBy,
            sortOrder,
            warehouseId
        );

        return Response.json({
            success: true,
            message: "Sales Orders Fetched Successfully",
            data: result.data,
            pagination: result.pagination,
        });

    } catch (error) {

        const statusCode = [
            "Invalid Sales Order Status",
            "Invalid Start Date",
            "Invalid End Date",
            "Start Date Cannot Be After End Date",
            "Invalid Sort Order",
            "Invalid Sort Field",
            "Invalid Warehouse ID",
        ].includes(error.message)
            ? 400
            : error.message === "Warehouse Not Found"
                ? 404
                : error.message.includes("Access Denied")
                    ? 403
                    : 500;

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
