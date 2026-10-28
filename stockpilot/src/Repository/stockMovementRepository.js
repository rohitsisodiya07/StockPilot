import * as model from "@/Model/index";

// -------------------- Create Stock Movement --------------------

const createStockMovement = async (data, transaction) => {
    return await model.StockMovement.create(data, {
        transaction,
    });
};

// -------------------- Get Inventory Movements --------------------

const getInventoryMovements = async (
    inventoryId,
    transaction = undefined
) => {
    return await model.StockMovement.findAll({
        where: { inventoryId },

        attributes: {
            exclude: ["createdAt", "updatedAt"],
        },

        include: [
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name", "email", "roleId"],
            },
        ],

        order: [["createdAt", "DESC"]],

        ...(transaction ? { transaction } : {}),
    });
};

// -------------------- Get One Stock Movement --------------------

const getOneStockMovement = async (
    id,
    transaction = undefined
) => {
    return await model.StockMovement.findByPk(id, {
        include: [
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name", "email", "roleId"],
            },
        ],

        ...(transaction ? { transaction } : {}),
    });
};

export {
    createStockMovement,
    getInventoryMovements,
    getOneStockMovement,
};