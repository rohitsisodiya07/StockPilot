
import * as dashboardService from "@/Service/dashboardService";

const getDashboardAnalytics = async (user, filters = {}) => {
    try {
        const data = await dashboardService.getDashboardAnalytics(
            user.id,
            user.roleId,
            filters
        );

        return Response.json({
            success: true,
            message: "Dashboard Analytics Fetched Successfully",
            data,
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
