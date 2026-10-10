import * as model from "@/Model/index";

//Creates a stock movement record
const createStockMovement = async (data, transaction) => {
    return await model.StockMovement.create(data, { transaction });
};

//Retrieves all movements for an inventory record, newest first.

const getInventoryMovements = async (inventoryId) => {
    return await model.StockMovement.findAll({
        where: { inventoryId },
        attributes: {
            exclude: ["createdAt", "updatedAt"],
        },
        include: [
            {
                model: model.User,
                as: "user",
                attributes: {
                    exclude: ["password", "createdAt", "updatedAt"],
                },
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};


const getOneStockMovement = async (id) => {
    return await model.StockMovement.findByPk(id, {
        include: [
            {
                model: model.User,
                as: "user",
                attributes: { exclude: ["password"] },
            },
        ],
    });
};

export {
    createStockMovement,
    getInventoryMovements,
    getOneStockMovement,
};
