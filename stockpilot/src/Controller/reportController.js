import * as reportService from "@/Service/reportService";

const handleReportError = (error) => {
    console.error("Report Controller Error:", error);

    const message = error?.message || "";

    let statusCode = 500;

    const badRequestErrors = [
        "Invalid Start Date",
        "Invalid End Date",
        "Start Date Cannot Be After End Date",
        "Invalid Warehouse ID",
        "Invalid Movement Type",
        "Invalid Purchase Order Status",
    ];

    if (badRequestErrors.includes(message)) {
        statusCode = 400;
    } else if (message === "Warehouse Not Found") {
        statusCode = 404;
    } else if (message.includes("Access Denied")) {
        statusCode = 403;
    }

    return Response.json(
        {
            success: false,
            message:
                statusCode === 500
                    ? "Internal Server Error"
                    : message,
        },
        { status: statusCode }
    );
};

const getSalesSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await reportService.getSalesSummary(
            user.id,
            user.roleId,
            searchParams.get("startDate"),
            searchParams.get("endDate"),
            searchParams.get("warehouseId")
        );

        return Response.json({
            success: true,
            message: "Sales Summary Fetched Successfully",
            data: result,
        });
    } catch (error) {
        return handleReportError(error);
    }
};

const getWarehouseSalesSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await reportService.getWarehouseSalesSummary(
            user.id,
            user.roleId,
            searchParams.get("startDate"),
            searchParams.get("endDate"),
            searchParams.get("warehouseId")
        );

        return Response.json({
            success: true,
            message: "Warehouse Sales Report Fetched Successfully",
            data: result,
        });
    } catch (error) {
        return handleReportError(error);
    }
};

const getInventoryReport = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await reportService.getInventoryReport(
            user.id,
            user.roleId,
            searchParams.get("warehouseId"),
            searchParams.get("lowStockOnly") === "true"
        );

        return Response.json({
            success: true,
            message: "Inventory Report Fetched Successfully",
            data: result,
        });
    } catch (error) {
        return handleReportError(error);
    }
};

const getStockMovementSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await reportService.getStockMovementSummary(
            user.id,
            user.roleId,
            searchParams.get("warehouseId"),
            searchParams.get("type"),
            searchParams.get("startDate"),
            searchParams.get("endDate")
        );

        return Response.json({
            success: true,
            message: "Stock Movement Report Fetched Successfully",
            data: result,
        });
    } catch (error) {
        return handleReportError(error);
    }
};

const getPurchaseSummary = async (request, user) => {
    try {
        const { searchParams } = new URL(request.url);

        const result = await reportService.getPurchaseSummary(
            user.id,
            user.roleId,
            searchParams.get("warehouseId"),
            searchParams.get("status"),
            searchParams.get("startDate"),
            searchParams.get("endDate")
        );

        return Response.json({
            success: true,
            message: "Purchase Report Fetched Successfully",
            data: result,
        });
    } catch (error) {
        return handleReportError(error);
    }
};

export {
    getSalesSummary,
    getWarehouseSalesSummary,
    getInventoryReport,
    getStockMovementSummary,
    getPurchaseSummary,
};
