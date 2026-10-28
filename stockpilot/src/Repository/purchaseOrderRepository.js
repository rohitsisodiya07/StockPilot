
import { Op } from "sequelize";
import * as model from "@/Model/index";

const ALLOWED_SORT_FIELDS = [
    "id",
    "status",
    "expectedDeliveryDate",
    "createdAt",
    "updatedAt",
];

// Create purchase order
const createPurchaseOrder = async (data, transaction = undefined) => {
    return model.PurchaseOrder.create(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Get purchase orders with filters, search, sorting and pagination
const getAllPurchaseOrders = async (
    warehouseIds = null,
    options = {}
) => {
    // Empty warehouse assignment means no access
    if (Array.isArray(warehouseIds) && warehouseIds.length === 0) {
        return { rows: [], count: 0 };
    }

    const {
        search = "",
        status,
        supplierId,
        warehouseId,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "DESC",
        limit = 10,
        offset = 0,
    } = options;

    const where = {};

    // Restrict results to assigned warehouses when applicable
    if (Array.isArray(warehouseIds)) {
        where.warehouseId = { [Op.in]: warehouseIds };
    }

    if (warehouseId !== undefined && warehouseId !== null) {
        if (
            where.warehouseId &&
            Array.isArray(where.warehouseId[Op.in])
        ) {
            where.warehouseId = {
                [Op.and]: [
                    where.warehouseId,
                    warehouseId,
                ],
            };
        } else {
            where.warehouseId = warehouseId;
        }
    }

    if (status) {
        where.status = status;
    }

    if (supplierId !== undefined && supplierId !== null) {
        where.supplierId = supplierId;
    }


    if (startDate || endDate) {
        where.expectedDeliveryDate = {};

        if (startDate) {
            where.expectedDeliveryDate[Op.gte] = startDate;
        }

        if (endDate) {
            where.expectedDeliveryDate[Op.lte] = endDate;
        }
    }


    const normalizedSearch = search.trim();

    if (normalizedSearch) {
        const searchConditions = [
            {
                "$supplier.name$": {
                    [Op.like]: `%${normalizedSearch}%`,
                },
            },
            {
                "$warehouse.name$": {
                    [Op.like]: `%${normalizedSearch}%`,
                },
            },
        ];

        const numericId = Number(normalizedSearch);

        if (
            Number.isSafeInteger(numericId) &&
            numericId > 0
        ) {
            searchConditions.push({ id: numericId });
        }

        where[Op.and] = [
            {
                [Op.or]: searchConditions,
            },
        ];
    }

    const result = await model.PurchaseOrder.findAndCountAll({
        where,
        include: [
            {
                model: model.Supplier,
                as: "supplier",
                attributes: ["id", "name", "email", "phone"],
                required: false,
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
                required: false,
            },
            {
                model: model.User,
                as: "creator",
                attributes: ["id", "name", "email"],
                required: false,
            },
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        distinct: true,
    });

    return {
        rows: result.rows,
        count: result.count,
    };
};

// Get one purchase order with items and related details
const getOnePurchaseOrder = async (
    id,
    transaction = undefined
) => {
    return model.PurchaseOrder.findByPk(id, {
        include: [
            {
                model: model.Supplier,
                as: "supplier",
                attributes: ["id", "name", "email", "phone", "address"],
            },
            {
                model: model.Warehouse,
                as: "warehouse",
                attributes: ["id", "name", "location"],
            },
            {
                model: model.User,
                as: "creator",
                attributes: ["id", "name", "email"],
            },
            {
                model: model.PurchaseOrderItem,
                as: "items",
                include: [
                    {
                        model: model.Product,
                        as: "product",
                        attributes: ["id", "name", "sku", "price"],
                    },
                ],
            },
        ],
        ...(transaction ? { transaction } : {}),
    });
};

// Update purchase order
const updatePurchaseOrder = async (
    id,
    data,
    transaction = undefined
) => {
    const purchaseOrder = await model.PurchaseOrder.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!purchaseOrder) {
        return null;
    }

    return purchaseOrder.update(data, {
        ...(transaction ? { transaction } : {}),
    });
};

// Delete only a draft order
const deletePurchaseOrder = async (
    id,
    transaction = undefined
) => {
    const purchaseOrder = await model.PurchaseOrder.findByPk(id, {
        ...(transaction ? { transaction } : {}),
    });

    if (!purchaseOrder) {
        return null;
    }

    if (purchaseOrder.status !== "DRAFT") {
        throw new Error("Only Draft Purchase Orders Can Be Deleted");
    }

    await model.PurchaseOrderItem.destroy({
        where: { purchaseOrderId: id },
        ...(transaction ? { transaction } : {}),
    });

    await purchaseOrder.destroy({
        ...(transaction ? { transaction } : {}),
    });

    return purchaseOrder;
};

export {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getOnePurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
};
