import * as model from "@/Model/index";
import { Op, col } from "sequelize";
//Checks if inventory already exists for a specific product in a specific warehouse.
const findInventory = async (productId, warehouseId) => {
    return await model.Inventory.findOne({
        where: {
            productId,
            warehouseId,
        },
    });
};

// Creates a new inventory record.
const createInventory = async (data) => {
    return await model.Inventory.create(data);
};

// Retrieves all inventory records for a warehouse, including product details.
const getWarehouseInventory = async (warehouseId) => {
    return await model.Inventory.findAll({
        where: {
            warehouseId,
        },
        attributes: ['id', 'productId', 'warehouseId', 'quantity', 'reorderLevel'],
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            },
        ],
    });
};

//Retrieves one inventory record by its ID, including product and warehouse details.
const getOneInventory = async (id) => {
    return await model.Inventory.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
            },
            {
                model: model.Warehouse,
                as: "warehouse",
            },
        ],
    });
};

// Updates an inventory record.
const updateInventory = async (id, data) => {
    const inventory = await model.Inventory.findByPk(id);

    if (!inventory) {
        return null;
    }

    return await inventory.update(data);
};

// Deletes an inventory record.
const deleteInventory = async (id) => {
    const inventory = await model.Inventory.findByPk(id);

    if (!inventory) {
        return null;
    }

    await inventory.destroy();

    return inventory;
};


//Finds products whose stock is at or below the reorder level.
const getLowStockInventory = async (warehouseId) => {
    return await model.Inventory.findAll({
        where: {
            warehouseId,
            quantity: {
                [Op.lte]: col("reorderLevel"),
                //Op.lte — Checks whether quantity is less than or equal to the reorder level.
                // col("reorderLevel") — Compares quantity with the database column reorderLevel.
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
    });
};



export {
    findInventory,
    createInventory,
    getWarehouseInventory,
    getOneInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory
};
