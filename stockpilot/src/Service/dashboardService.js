import * as dashboardRepository from "@/Repository/dashboardRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const getDashboardAnalytics = async (userId, roleId) => {
    let warehouseIds = null;

    if (roleId !== 1) {
        const warehouses = await userWarehouseService.getUserWarehouses(userId);

        warehouseIds = warehouses.map((item) => item.warehouseId);
    }

    const [
        totalProducts,
        totalWarehouses,
        totalInventoryUnits,
        lowStockCount,
        recentStockMovements,
    ] = await Promise.all([
        dashboardRepository.getTotalProducts(warehouseIds),
        dashboardRepository.getTotalWarehouses(warehouseIds),
        dashboardRepository.getTotalInventoryUnits(warehouseIds),
        dashboardRepository.getLowStockCount(warehouseIds),
        dashboardRepository.getRecentStockMovements(warehouseIds),
    ]);

    return {
        totalProducts,
        totalWarehouses,
        totalInventoryUnits,
        lowStockCount,
        recentStockMovements,
    };
};

export { getDashboardAnalytics };
