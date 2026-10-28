import * as model from "@/Model/index";

// -------------------- Find Category By Name --------------------

const findByName = async (name, transaction = undefined) => {
    return await model.Category.findOne({
        where: { name },
        transaction,
    });
};

// -------------------- Create Category --------------------

const createCategory = async (data, transaction = undefined) => {
    return await model.Category.create(data, {
        transaction,
    });
};

// -------------------- Get All Categories --------------------

const getAllCategories = async (options = {}) => {
    const {
        transaction = undefined,
        limit,
        offset,
        activeOnly = false,
    } = options;

    const where = activeOnly
        ? { status: "ACTIVE" }
        : {};

    return await model.Category.findAll({
        where,
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        transaction,
        order: [["name", "ASC"]],
    });
};

// -------------------- Get One Category --------------------

const getOneCategory = async (id, transaction = undefined) => {
    return await model.Category.findByPk(id, {
        transaction,
    });
};

// -------------------- Update Category --------------------

const updateCategory = async (
    id,
    data,
    transaction = undefined
) => {
    const category = await model.Category.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!category) {
        return null;
    }

    return await category.update(data, {
        transaction,
    });
};

// -------------------- Deactivate Category --------------------

const deactivateCategory = async (
    id,
    transaction = undefined
) => {
    const category = await model.Category.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!category) {
        return null;
    }

    if (category.status === "INACTIVE") {
        return category;
    }

    return await category.update(
        { status: "INACTIVE" },
        { transaction }
    );
};

export {
    findByName,
    createCategory,
    getAllCategories,
    getOneCategory,
    updateCategory,
    deactivateCategory,
};