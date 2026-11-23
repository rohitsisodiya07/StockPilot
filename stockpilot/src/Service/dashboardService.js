
import * as dashboardRepository from "@/Repository/dashboardRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const ADMIN_ROLE_ID = 1;

const parsePositiveInt = (value, fieldName, defaultValue = null) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return parsed;
};

const validateDate = (value, fieldName) => {
    if (!value) return null;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid ${fieldName}; use YYYY-MM-DD`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return value;
};

const getDashboardAnalytics = async (
    userId,
    roleId,
    filters = {}
) => {
    const isAdmin = Number(roleId) === ADMIN_ROLE_ID;

    // null means all warehouses for admin.
    // Non-admin users can access only assigned warehouses.
    let allowedWarehouseIds = null;

    if (!isAdmin) {
        const assignments =
            await userWarehouseService.getUserWarehouses(userId);

        allowedWarehouseIds = [
            ...new Set(
                assignments.map((assignment) =>
                    Number(assignment.warehouseId)
                )
            ),
        ];
    }

    const requestedWarehouseId = parsePositiveInt(
        filters.warehouseId,
        "warehouseId"
    );

    const requestedUserId = parsePositiveInt(
        filters.userId,
        "userId"
    );

    const requestedRoleId = parsePositiveInt(
        filters.activityRoleId,
        "activityRoleId"
    );

    const startDate = validateDate(
        filters.startDate,
        "startDate"
    );

    const endDate = validateDate(
        filters.endDate,
        "endDate"
    );

    if (startDate && endDate && startDate > endDate) {
        throw new Error(
            "startDate must be before or equal to endDate"
        );
    }

    const page = parsePositiveInt(filters.page, "page", 1);
    const limit = parsePositiveInt(filters.limit, "limit", 10);

    if (limit > 100) {
        throw new Error("limit cannot be greater than 100");
    }

    if (
        requestedRoleId !== null &&
        ![1, 4, 5].includes(requestedRoleId)
    ) {
        throw new Error("Invalid activityRoleId");
    }

    if (
        !isAdmin &&
        requestedRoleId !== null &&
        requestedRoleId !== Number(roleId)
    ) {
        throw new Error(
            "You cannot filter activity by another role"
        );
    }

    if (
        requestedWarehouseId !== null &&
        !isAdmin &&
        !allowedWarehouseIds.includes(requestedWarehouseId)
    ) {
        throw new Error(
            "You do not have access to this warehouse"
        );
    }

    // Analytics are scoped to the selected warehouse.
    // The dropdown still receives all warehouses accessible to the user.
    const effectiveWarehouseIds =
        requestedWarehouseId !== null
            ? [requestedWarehouseId]
            : allowedWarehouseIds;

    const today = new Date().toISOString().slice(0, 10);

    const defaultStart = new Date();
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);

    const chartStartDate =
        startDate || defaultStart.toISOString().slice(0, 10);

    const chartEndDate = endDate || today;

    const [
        totalProducts,
        totalWarehouses,
        totalInventoryUnits,
        lowStockCount,
        movementResult,
        chartMovements,
        warehouseStock,
        warehouseOptions,
        warehouseUsers,
        orderSummary,
        lowStockItems,
        totalStockValuation,
    ] = await Promise.all([
        dashboardRepository.getTotalProducts(
            effectiveWarehouseIds
        ),

        dashboardRepository.getTotalWarehouses(
            effectiveWarehouseIds
        ),

        dashboardRepository.getTotalInventoryUnits(
            effectiveWarehouseIds
        ),

        dashboardRepository.getLowStockCount(
            effectiveWarehouseIds
        ),

        dashboardRepository.getRecentStockMovements({
            warehouseIds: effectiveWarehouseIds,
            warehouseId: requestedWarehouseId,
            userId: requestedUserId,
            roleId: requestedRoleId,
            startDate,
            endDate,
            limit,
            offset: (page - 1) * limit,
        }),

        dashboardRepository.getStockMovementsForChart({
            warehouseIds: effectiveWarehouseIds,
            warehouseId: requestedWarehouseId,
            userId: requestedUserId,
            roleId: requestedRoleId,
            startDate: chartStartDate,
            endDate: chartEndDate,
        }),

        dashboardRepository.getWarehouseStockSummary(
            effectiveWarehouseIds
        ),

        // Keep dropdown options independent of selected warehouse.
        dashboardRepository.getWarehouseOptions(
            allowedWarehouseIds
        ),

        // Global admin + managers/staff assigned to selected warehouse.
        dashboardRepository.getWarehouseUsers(
            requestedWarehouseId
        ),

        dashboardRepository.getOrderSummary(
            effectiveWarehouseIds
        ),

        dashboardRepository.getLowStockItems(
            effectiveWarehouseIds
        ),

        dashboardRepository.getTotalStockValuation(
            effectiveWarehouseIds
        ),
    ]);

    // Calculate depletion forecasting for low stock items
    const totalOut = chartMovements
        .filter((m) => m.type === "OUT")
        .reduce((s, m) => s + Number(m.quantity || 0), 0);
    const avgDailyOut = Math.max(0.5, Number((totalOut / 30).toFixed(1)));

    const enhancedLowStockItems = lowStockItems.map((item) => {
        const itemObj = item.toJSON ? item.toJSON() : item;
        const currentQty = Number(itemObj.quantity || 0);
        const reorderLevel = Number(itemObj.reorderLevel || 10);

        const daysRemaining = currentQty <= 0 ? 0 : Math.max(1, Math.round(currentQty / avgDailyOut));
        const urgency = daysRemaining <= 3 ? "CRITICAL" : daysRemaining <= 7 ? "WARNING" : "MODERATE";
        const suggestedReorderQuantity = Math.max(Math.ceil((reorderLevel * 2.5) - currentQty), 10);

        return {
            ...itemObj,
            depletionRate: avgDailyOut,
            daysRemaining,
            urgency,
            suggestedReorderQuantity,
        };
    });

    // Group chart movements by date.
    const chartMap = new Map();

    for (const movement of chartMovements) {
        const date = new Date(movement.createdAt)
            .toISOString()
            .slice(0, 10);

        if (!chartMap.has(date)) {
            chartMap.set(date, {
                date,
                stockIn: 0,
                stockOut: 0,
            });
        }

        const row = chartMap.get(date);
        const quantity = Number(movement.quantity) || 0;

        if (movement.type === "IN") {
            row.stockIn += quantity;
        }

        if (movement.type === "OUT") {
            row.stockOut += quantity;
        }
    }

    // Include dates with no movements so the chart remains continuous.
    const chartData = [];

    const cursor = new Date(
        `${chartStartDate}T00:00:00.000Z`
    );

    const last = new Date(
        `${chartEndDate}T00:00:00.000Z`
    );

    while (cursor <= last) {
        const date = cursor.toISOString().slice(0, 10);

        chartData.push(
            chartMap.get(date) || {
                date,
                stockIn: 0,
                stockOut: 0,
            }
        );

        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const totalRecords = movementResult.count;
    const totalPages = Math.ceil(totalRecords / limit);

    return {
        filters: {
            warehouseId: requestedWarehouseId,
            userId: requestedUserId,
            activityRoleId: requestedRoleId,
            startDate,
            endDate,
            page,
            limit,
        },

        summary: {
            totalProducts,
            totalWarehouses,
            totalInventoryUnits,
            lowStockCount,
            totalStockValuation: Number(totalStockValuation || 0),
        },

        options: {
            warehouses: warehouseOptions,
            warehouseUsers,
        },

        stockAnalytics: {
            chartStartDate,
            chartEndDate,
            chartData,
            warehouseStock,
        },

        activity: {
            recentStockMovements: movementResult.rows,
            pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
            },
        },

        orders: orderSummary,

        alerts: {
            lowStockItems: enhancedLowStockItems,
        },
    };
};

export { getDashboardAnalytics };
