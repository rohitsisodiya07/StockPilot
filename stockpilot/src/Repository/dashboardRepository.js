import { Op, col } from "sequelize";
import * as model from "@/Model/index";

const getTotalProducts = async (warehouseIds = null) => {
    if (warehouseIds === null) {
        return await model.Product.count();
    }

    return await model.Inventory.count({
        where: {
            warehouseId: { [Op.in]: warehouseIds },
        },
        distinct: true,
        col: "productId",
    });
};

const getTotalWarehouses = async (warehouseIds = null) => {
    const where = warehouseIds === null
        ? {}
        : { id: { [Op.in]: warehouseIds } };

    return await model.Warehouse.count({ where });
};

const getTotalInventoryUnits = async (warehouseIds = null) => {
    const where = warehouseIds === null
        ? {}
        : { warehouseId: { [Op.in]: warehouseIds } };

    return (await model.Inventory.sum("quantity", { where })) || 0;
};

const getLowStockCount = async (warehouseIds = null) => {
    const where = {
        quantity: { [Op.lte]: col("reorderLevel") },
    };

    if (warehouseIds !== null) {
        where.warehouseId = { [Op.in]: warehouseIds };
    }

    return await model.Inventory.count({ where });
};

const getRecentStockMovements = async (warehouseIds = null) => {
    const inventoryInclude = {
        model: model.Inventory,
        as: "inventory",
        attributes: ["id", "warehouseId"],
        required: warehouseIds !== null,
    };

    if (warehouseIds !== null) {
        inventoryInclude.where = {
            warehouseId: { [Op.in]: warehouseIds },
        };
    }

    return await model.StockMovement.findAll({
        limit: 5,
        order: [["createdAt", "DESC"]],
        attributes: { exclude: ["updatedAt"] },
        include: [
            inventoryInclude,
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name"],
            },
        ],
    });
};

export {
    getTotalProducts,
    getTotalWarehouses,
    getTotalInventoryUnits,
    getLowStockCount,
    getRecentStockMovements,
};
