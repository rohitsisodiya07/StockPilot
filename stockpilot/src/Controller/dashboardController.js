
import * as dashboardService from "@/Service/dashboardService";
import cache from "@/lib/cache";

const getDashboardAnalytics = async (user, filters = {}) => {
    try {
        const cacheKey = `dashboard:${user.id}:${user.roleId}:${filters.warehouseId || "all"}:${filters.page || "1"}:${filters.startDate || ""}:${filters.endDate || ""}:${filters.userId || ""}:${filters.activityRoleId || ""}`;

        const isBypass = filters.refresh === "true" || filters.refresh === true;
        if (!isBypass) {
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                return Response.json({
                    success: true,
                    message: "Dashboard Analytics Fetched Successfully (Cached)",
                    data: cachedData,
                    cached: true,
                });
            }
        }

        const data = await dashboardService.getDashboardAnalytics(
            user.id,
            user.roleId,
            filters
        );

        // Cache for 45 seconds to drastically reduce DB strain
        await cache.set(cacheKey, data, 45);

        return Response.json({
            success: true,
            message: "Dashboard Analytics Fetched Successfully",
            data,
            cached: false,
        });
    } catch (error) {
        console.error("Dashboard Controller Error:", error);

        const message = error.message || "Failed to Fetch Dashboard Analytics";

        const status =
            message.startsWith("Invalid ") ||
                message.includes("must be before") ||
                message.includes("use YYYY-MM-DD") ||
                message.includes("cannot be greater than")
                ? 400
                : message.includes("do not have access") ||
                    message.includes("cannot filter activity")
                    ? 403
                    : message.includes("not found")
                        ? 404
                        : 500;

        return Response.json(
            {
                success: false,
                message: status === 500
                    ? "Failed to Fetch Dashboard Analytics"
                    : message,
            },
            { status }
        );
    }
};

export { getDashboardAnalytics };
