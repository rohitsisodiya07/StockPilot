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

// Retrieves all inventory records for a warehouse with optional pagination & search.
const getWarehouseInventory = async (warehouseId, options = {}, transaction = undefined) => {
    let actualOptions = options;
    let actualTransaction = transaction;

    // Handle if options was passed as transaction
    if (options && (options.commit || options.rollback || options.LOCK)) {
        actualTransaction = options;
        actualOptions = {};
    }

    const { limit, offset, search } = actualOptions || {};

    const productInclude = {
        model: model.Product,
        as: "product",
        attributes: ["id", "name", "sku", "price"],
    };

    if (search && typeof search === "string" && search.trim()) {
        productInclude.where = {
            [Op.or]: [
                { name: { [Op.like]: `%${search.trim()}%` } },
                { sku: { [Op.like]: `%${search.trim()}%` } },
            ],
        };
    }

    const query = {
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
        include: [productInclude],
        order: [["id", "DESC"]],
        ...(actualTransaction ? { transaction: actualTransaction } : {}),
    };

    if (limit && Number(limit) > 0) {
        query.limit = Number(limit);
        if (offset && Number(offset) >= 0) {
            query.offset = Number(offset);
        }
        return await model.Inventory.findAndCountAll(query);
    }

    return await model.Inventory.findAll(query);
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

const getInventoryByWarehouseIds = async (warehouseIds) => {
    return await model.Inventory.findAll({
        where: {
            warehouseId: {
                [Op.in]: warehouseIds,
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
    getInventoryByWarehouseIds
};