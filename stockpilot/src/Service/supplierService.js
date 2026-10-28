
import * as supplierRepository from "@/Repository/supplierRepository";

const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE"];

const ALLOWED_SORT_FIELDS = [
    "name",
    "createdAt",
    "updatedAt",
];

// -------------------- Helpers --------------------

const validateSupplierId = (id) => {
    const supplierId = Number(id);

    if (
        id === undefined ||
        id === null ||
        id === "" ||
        !Number.isSafeInteger(supplierId) ||
        supplierId <= 0
    ) {
        throw new Error("Valid Supplier ID Is Required");
    }

    return supplierId;
};

const validateObject = (data) => {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error("Invalid Supplier Data");
    }
};

// -------------------- Validate Supplier Data --------------------

const validateSupplierData = (data, isUpdate = false) => {
    validateObject(data);

    const allowedFields = [
        "name",
        "email",
        "phone",
        "address",
        "status",
    ];

    const fields = Object.keys(data);

    if (
        fields.length === 0 ||
        fields.some((field) => !allowedFields.includes(field))
    ) {
        throw new Error("Invalid or Missing Supplier Fields");
    }

    const validated = {};

    // Supplier Name
    if (!isUpdate || "name" in data) {
        if (
            typeof data.name !== "string" ||
            data.name.trim().length < 2 ||
            data.name.trim().length > 150
        ) {
            throw new Error("Valid Supplier Name Is Required");
        }

        validated.name = data.name.trim();
    }

    // Supplier Phone
    if (!isUpdate || "phone" in data) {
        if (
            typeof data.phone !== "string" ||
            !/^[+]?[\d\s()-]{7,20}$/.test(data.phone.trim())
        ) {
            throw new Error("Valid Supplier Phone Is Required");
        }

        validated.phone = data.phone.trim();
    }

    // Supplier Email — Required
    if (!isUpdate || "email" in data) {
        if (
            typeof data.email !== "string" ||
            data.email.trim().length === 0 ||
            data.email.trim().length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ) {
            throw new Error("Valid Supplier Email Is Required");
        }

        validated.email = data.email.trim().toLowerCase();
    }

    // Supplier Address — Required
    if (!isUpdate || "address" in data) {
        if (
            typeof data.address !== "string" ||
            data.address.trim().length === 0
        ) {
            throw new Error("Valid Supplier Address Is Required");
        }

        if (data.address.trim().length > 2000) {
            throw new Error("Supplier Address Is Too Long");
        }

        validated.address = data.address.trim();
    }

    // Supplier Status
    if ("status" in data) {
        if (!ALLOWED_STATUSES.includes(data.status)) {
            throw new Error("Invalid Supplier Status");
        }

        validated.status = data.status;
    }

    return validated;
};

// -------------------- Create Supplier --------------------

const createSupplier = async (data) => {
    const validatedData = validateSupplierData(data);

    // Duplicate name check (requires repository method)
    const existingName = await supplierRepository.findByName(
        validatedData.name
    );

    if (existingName) {
        throw new Error("Supplier Name Already Exists");
    }

    // Duplicate email check
    const existingEmail = await supplierRepository.findByEmail(
        validatedData.email
    );

    if (existingEmail) {
        throw new Error("Supplier Email Already Exists");
    }

    try {
        return await supplierRepository.createSupplier(validatedData);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            const fields = error.fields || {};

            if (fields.email) {
                throw new Error("Supplier Email Already Exists");
            }

            if (fields.name) {
                throw new Error("Supplier Name Already Exists");
            }
        }

        throw error;
    }
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
    } = options;

    if (
        typeof limit !== "number" ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        throw new Error("Valid Supplier Limit Is Required");
    }

    if (
        typeof offset !== "number" ||
        !Number.isSafeInteger(offset) ||
        offset < 0
    ) {
        throw new Error("Valid Supplier Offset Is Required");
    }

    if (
        typeof search !== "undefined" &&
        (
            typeof search !== "string" ||
            search.trim().length > 100
        )
    ) {
        throw new Error("Valid Supplier Search Is Required");
    }

    if (
        status !== undefined &&
        !ALLOWED_STATUSES.includes(status)
    ) {
        throw new Error("Invalid Supplier Status");
    }

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        throw new Error("Invalid Supplier Sort Field");
    }

    const normalizedSortOrder = String(sortOrder).toUpperCase();

    if (!["ASC", "DESC"].includes(normalizedSortOrder)) {
        throw new Error("Invalid Supplier Sort Order");
    }

    const result = await supplierRepository.getAllSuppliers({
        search: search?.trim() || undefined,
        status,
        sortBy,
        sortOrder: normalizedSortOrder,
        limit,
        offset,
    });

    return {
        suppliers: result.rows,
        pagination: {
            total: result.count,
            limit,
            offset,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(result.count / limit),
        },
    };
};

// -------------------- Get One Supplier --------------------

const getOneSupplier = async (id) => {
    const supplierId = validateSupplierId(id);

    const supplier = await supplierRepository.getOneSupplier(supplierId);

    if (!supplier) {
        throw new Error("Supplier Not Found");
    }

    return supplier;
};

// -------------------- Update Supplier --------------------

const updateSupplier = async (id, data) => {
    const supplierId = validateSupplierId(id);
    const validatedData = validateSupplierData(data, true);

    await getOneSupplier(supplierId);

    // Duplicate name check (exclude current supplier)
    if (validatedData.name) {
        const existingName = await supplierRepository.findByName(
            validatedData.name,
            supplierId
        );

        if (existingName) {
            throw new Error("Supplier Name Already Exists");
        }
    }

    // Duplicate email check (exclude current supplier)
    if (validatedData.email) {
        const existingEmail = await supplierRepository.findByEmail(
            validatedData.email,
            supplierId
        );

        if (existingEmail) {
            throw new Error("Supplier Email Already Exists");
        }
    }

    try {
        const updated = await supplierRepository.updateSupplier(
            supplierId,
            validatedData
        );

        if (!updated) {
            throw new Error("Supplier Not Found");
        }

        return updated;
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            const fields = error.fields || {};

            if (fields.email) {
                throw new Error("Supplier Email Already Exists");
            }

            if (fields.name) {
                throw new Error("Supplier Name Already Exists");
            }
        }

        throw error;
    }
};

// -------------------- Deactivate Supplier --------------------

const deleteSupplier = async (id) => {
    const supplierId = validateSupplierId(id);

    const supplier = await supplierRepository.getOneSupplier(supplierId);

    if (!supplier) {
        throw new Error("Supplier Not Found");
    }

    if (supplier.status === "INACTIVE") {
        throw new Error("Supplier Is Already Inactive");
    }

    return await supplierRepository.deleteSupplier(supplierId);
};

export {
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
