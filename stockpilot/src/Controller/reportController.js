import * as reportService from "@/Service/reportService";

const getSalesSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const warehouseId = searchParams.get("warehouseId");

        const result = await reportService.getSalesSummary(
            user.id,
            user.roleId,
            startDate,
            endDate,
            warehouseId
        );

        return Response.json({
            success: true,
            message: "Sales Summary Fetched Successfully",
            data: result,
        });
    } catch (error) {

        const statusCode = [
            "Invalid Start Date",
            "Invalid End Date",
            "Start Date Cannot Be After End Date",
            "Invalid Warehouse ID",
        ].includes(error.message)
            ? 400
            : error.message === "Warehouse Not Found"
                ? 404
                : error.message.includes("Access Denied")
                    ? 403
                    : 500;


        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
};


const getWarehouseSalesSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const warehouseId = searchParams.get("warehouseId");

        const result = await reportService.getWarehouseSalesSummary(
            user.id,
            user.roleId,
            startDate,
            endDate,
            warehouseId
        );

        return Response.json({
            success: true,
            message: "Warehouse Sales Report Fetched Successfully",
            data: result,
        });
    } catch (error) {
        const statusCode = [
            "Invalid Start Date",
            "Invalid End Date",
            "Start Date Cannot Be After End Date",
            "Invalid Warehouse ID",
        ].includes(error.message)
            ? 400
            : error.message === "Warehouse Not Found"
                ? 404
                : error.message.includes("Access Denied")
                    ? 403
                    : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
};


export const getInventoryReport = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const warehouseId = searchParams.get("warehouseId");
        const lowStockOnly = searchParams.get("lowStockOnly") === "true";

        const result = await reportService.getInventoryReport(
            user.id,
            user.roleId,
            warehouseId,
            lowStockOnly
        );

        return Response.json(
            {
                success: true,
                message: "Inventory Report Fetched Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        const statusCode =
            error.message === "Invalid Warehouse ID" ? 400 :
                error.message === "Warehouse Not Found" ? 404 :
                    error.message.includes("Access Denied") ? 403 :
                        500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
};


export const getStockMovementSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const warehouseId = searchParams.get("warehouseId");
        const movementType = searchParams.get("type");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const result = await reportService.getStockMovementSummary(
            user.id,
            user.roleId,
            warehouseId,
            movementType,
            startDate,
            endDate
        );

        return Response.json(
            {
                success: true,
                message: "Stock Movement Report Fetched Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        const statusCode = [
            "Invalid Start Date",
            "Invalid End Date",
            "Start Date Cannot Be After End Date",
            "Invalid Warehouse ID",
            "Invalid Movement Type",
        ].includes(error.message)
            ? 400
            : error.message === "Warehouse Not Found"
                ? 404
                : error.message.includes("Access Denied")
                    ? 403
                    : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
};


export const getPurchaseSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const warehouseId = searchParams.get("warehouseId");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const result = await reportService.getPurchaseSummary(
            user.id,
            user.roleId,
            warehouseId,
            status,
            startDate,
            endDate
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Report Fetched Successfully",
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        const statusCode = [
            "Invalid Start Date",
            "Invalid End Date",
            "Start Date Cannot Be After End Date",
            "Invalid Warehouse ID",
            "Invalid Purchase Order Status",
        ].includes(error.message)
            ? 400
            : error.message === "Warehouse Not Found"
                ? 404
                : error.message.includes("Access Denied")
                    ? 403
                    : 500;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: statusCode }
        );
    }
};


export { getSalesSummary, getWarehouseSalesSummary, getInventoryReport, getStockMovementSummary };
