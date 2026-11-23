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
    options = {},
    transaction = undefined
) => {
    let actualOptions = options;
    let actualTransaction = transaction;

    if (options && (options.commit || options.rollback || options.LOCK)) {
        actualTransaction = options;
        actualOptions = {};
    }

    const { limit, offset } = actualOptions || {};

    const query = {
        where: { inventoryId },
        include: [
            {
                model: model.User,
                as: "user",
                attributes: ["id", "name", "email", "roleId"],
            },
        ],
        order: [["createdAt", "DESC"], ["id", "DESC"]],
        ...(actualTransaction ? { transaction: actualTransaction } : {}),
    };

    if (limit && Number(limit) > 0) {
        query.limit = Number(limit);
        if (offset && Number(offset) >= 0) {
            query.offset = Number(offset);
        }
        return await model.StockMovement.findAndCountAll(query);
    }

    return await model.StockMovement.findAll(query);
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