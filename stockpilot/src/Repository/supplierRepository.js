
import { Op } from "sequelize";
import * as model from "@/Model/index";

// -------------------- Find Supplier By Name --------------------

const findByName = async (name, excludeId = null) => {
    const where = {
        name: {
            [Op.like]: name.trim(),
        },
    };

    if (excludeId !== null) {
        where.id = { [Op.ne]: excludeId };
    }

    return await model.Supplier.findOne({ where });
};

// -------------------- Find Supplier By Email --------------------

const findByEmail = async (email, excludeId = null) => {
    const where = { email };

    if (excludeId !== null) {
        where.id = { [Op.ne]: excludeId };
    }

    return await model.Supplier.findOne({ where });
};

// -------------------- Create Supplier --------------------

const createSupplier = async (data, transaction = undefined) => {
    return await model.Supplier.create(data, { transaction });
};

// -------------------- Get All Suppliers --------------------

const getAllSuppliers = async (options = {}) => {
    const {
        search,
        status,
        sortBy = "createdAt",
        sortOrder = "DESC",
        limit = 10,
        offset = 0,
        transaction,
    } = options;

    const where = {};

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
        ];
    }

    if (status) {
        where.status = status;
    }

    const result = await model.Supplier.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        transaction,
    });

    return {
        rows: result.rows,
        count: result.count,
    };
};

// -------------------- Get Supplier By ID --------------------

const getOneSupplier = async (id, transaction = undefined) => {
    return await model.Supplier.findByPk(id, { transaction });
};

// -------------------- Update Supplier --------------------

const updateSupplier = async (
    id,
    data,
    transaction = undefined
) => {
    const supplier = await model.Supplier.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!supplier) {
        return null;
    }

    return await supplier.update(data, { transaction });
};

// -------------------- Soft Delete / Deactivate --------------------

const deleteSupplier = async (id, transaction = undefined) => {
    const supplier = await model.Supplier.findByPk(id, {
        transaction,
        ...(transaction && {
            lock: transaction.LOCK.UPDATE,
        }),
    });

    if (!supplier) {
        return null;
    }

    if (supplier.status === "INACTIVE") {
        throw new Error("Supplier Is Already Inactive");
    }

    return await supplier.update(
        { status: "INACTIVE" },
        { transaction }
    );
};

export {
    findByName,
    findByEmail,
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
