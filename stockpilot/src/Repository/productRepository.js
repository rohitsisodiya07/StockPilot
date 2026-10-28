import { Op } from "sequelize";
import * as model from "@/Model/index";
// -------------------- Find Product By SKU --------------------

const findBySKU = async (sku, transaction = undefined) => {
    return await model.Product.findOne({
        where: { sku },
        transaction,
    });
};

// -------------------- Create Product --------------------

const createProduct = async (data, transaction = undefined) => {
    return await model.Product.create(data, {
        transaction,
    });
};

const getAllProducts = async (options = {}) => {
    const {
        transaction,
        limit,
        offset,
        activeOnly = false,
        search,
        categoryId,
    } = options;

    const where = {};

    // Filter active products
    if (activeOnly) {
        where.status = "ACTIVE";
    }

    // Search by product name or SKU
    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { sku: { [Op.like]: `%${search}%` } },
        ];
    }

    // Filter by category
    if (categoryId !== undefined) {
        where.categoryId = categoryId;
    }

    return await model.Product.findAll({
        where,
        include: [
            {
                model: model.Category,
                as: "category",
                attributes: ["id", "name", "status"],
                required: false,
            },
        ],
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(transaction && { transaction }),
        order: [["createdAt", "DESC"]],
    });
};

// -------------------- Fetch One Product By ID --------------------

const getOneProduct = async (id, transaction = undefined) => {
    return await model.Product.findByPk(id, {
        include: [
            {
                model: model.Category,
                as: "category",
                attributes: ["id", "name", "status"],
                required: false,
            },
        ],
        transaction,
    });
};

// -------------------- Update Product --------------------

const updateProduct = async (
    id,
    data,
    transaction = undefined
) => {
    const product = await model.Product.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!product) {
        return null;
    }

    return await product.update(data, {
        transaction,
    });
};

// -------------------- Deactivate Product --------------------

const deleteProduct = async (
    id,
    transaction = undefined
) => {
    const product = await model.Product.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!product) {
        return null;
    }

    if (product.status === "INACTIVE") {
        return product;
    }

    return await product.update(
        { status: "INACTIVE" },
        { transaction }
    );
};

export {
    findBySKU,
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};