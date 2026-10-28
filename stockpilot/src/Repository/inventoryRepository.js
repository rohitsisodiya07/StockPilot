import * as model from "@/Model/index";
import { Op, col } from "sequelize";

// Checks whether inventory exists for a product in a warehouse.
const findInventory = async (productId, warehouseId, transaction = undefined) => {
    return await model.Inventory.findOne({
        where: {
            productId,
            warehouseId,
        },
        ...(transaction ? { transaction } : {}),
    });
};

// Creates a new inventory record.
const createInventory = async (data, transaction = undefined) => {
    return await model.Inventory.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Retrieves all inventory records for a warehouse.
const getWarehouseInventory = async (warehouseId, transaction = undefined) => {
    return await model.Inventory.findAll({
        where: {
            warehouseId,
        },
        attributes: [
            "id",
            "productId",
            "warehouseId",
            "quantity",
            "reorderLevel",
        ],
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

//Get All
const getAllInventory = async (transaction = undefined) => {
    return await model.Inventory.findAll({
        attributes: [
            "id",
            "productId",
            "warehouseId",
            "quantity",
            "reorderLevel",
        ],
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

// Retrieves one inventory record with product and warehouse details.
const getOneInventory = async (id, transaction = undefined) => {
    return await model.Inventory.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: {
                    exclude: ["createdAt", "updatedAt"],
                },
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

// Updates an inventory record.
const updateInventory = async (id, data, transaction = undefined) => {
    const inventory = await model.Inventory.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!inventory) {
        return null;
    }

    return await inventory.update(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Deletes an inventory record.
const deleteInventory = async (id, transaction = undefined) => {
    const inventory = await model.Inventory.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!inventory) {
        return null;
    }

    await inventory.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return inventory;
};

// Finds inventory whose quantity is at or below its reorder level.
const getLowStockInventory = async (warehouseId, transaction = undefined) => {
    return await model.Inventory.findAll({
        where: {
            warehouseId,
            quantity: {
                [Op.lte]: col("reorderLevel"),
            },
        },
        attributes: [
            "id",
            "productId",
            "warehouseId",
            "quantity",
            "reorderLevel",
        ],
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku"],
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

export {
    findInventory,
    createInventory,
    getWarehouseInventory,
    getAllInventory,
    getOneInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory,
};