import * as dashboardService from "@/Service/dashboardService";

const getDashboardAnalytics = async (user) => {
    try {
        const data = await dashboardService.getDashboardAnalytics(
            user.id,
            user.roleId
        );

        return Response.json({
            success: true,
            message: "Dashboard Analytics Fetched Successfully",
            data,
        });
    } catch (error) {
        console.error("Dashboard Controller Error:", error);

        return Response.json(
            {
                success: false,
                message: "Failed to Fetch Dashboard Analytics",
            },
            { status: 500 }
        );
    }
};

export { getDashboardAnalytics };
