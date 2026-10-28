
import { Op } from "sequelize";
import * as model from "@/Model/index";

// Create purchase order item
const createPurchaseOrderItem = async (data, transaction = undefined) => {
    return model.PurchaseOrderItem.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Get purchase order items with search, sorting and pagination
const getPurchaseOrderItems = async (
    purchaseOrderId,
    options = {},
    transaction = undefined
) => {
    const {
        search = "",
        sortBy = "id",
        sortOrder = "ASC",
        limit = 10,
        offset = 0,
    } = options;

    const where = {
        purchaseOrderId,
    };

    const include = [
        {
            model: model.Product,
            as: "product",
            attributes: ["id", "name", "sku", "price"],
            required: Boolean(search.trim()),
            ...(search.trim()
                ? {
                      where: {
                          [Op.or]: [
                              {
                                  name: {
                                      [Op.like]: `%${search.trim()}%`,
                                  },
                              },
                              {
                                  sku: {
                                      [Op.like]: `%${search.trim()}%`,
                                  },
                              },
                          ],
                      },
                  }
                : {}),
        },
    ];

    const result = await model.PurchaseOrderItem.findAndCountAll({
        where,
        include,
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        distinct: true,
        ...(transaction ? { transaction } : {}),
    });

    return {
        rows: result.rows,
        count: result.count,
    };
};

// Get one purchase order item by ID
const getOnePurchaseOrderItem = async (
    id,
    transaction = undefined
) => {
    return model.PurchaseOrderItem.findByPk(id, {
        include: [
            {
                model: model.Product,
                as: "product",
                attributes: ["id", "name", "sku", "price"],
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

// Delete purchase order item by ID
const deletePurchaseOrderItem = async (
    id,
    transaction = undefined
) => {
    const item = await model.PurchaseOrderItem.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!item) {
        return null;
    }

    await item.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return item;
};

export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
    getOnePurchaseOrderItem,
    deletePurchaseOrderItem,
};
