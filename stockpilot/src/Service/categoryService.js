import * as categoryRepository from "@/Repository/categoryRepository";

// -------------------- Helpers --------------------

const validateCategoryId = (id) => {
    const categoryId = Number(id);

    if (
        id === undefined ||
        id === null ||
        id === "" ||
        !Number.isSafeInteger(categoryId) ||
        categoryId <= 0
    ) {
        throw new Error("Valid Category ID Is Required");
    }

    return categoryId;
};

const validateCategoryData = (data, isUpdate = false) => {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error("Invalid Category Data");
    }

    const allowedFields = ["name", "description", "status"];
    const fields = Object.keys(data);

    if (
        fields.length === 0 ||
        fields.some((field) => !allowedFields.includes(field))
    ) {
        throw new Error("Invalid or Missing Category Fields");
    }

    if (!isUpdate || "name" in data) {
        if (
            typeof data.name !== "string" ||
            data.name.trim().length < 2 ||
            data.name.trim().length > 100
        ) {
            throw new Error("Valid Category Name Is Required");
        }

        data.name = data.name.trim();
    }

    if ("description" in data) {
        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            throw new Error("Invalid Category Description");
        }
    }

    if ("status" in data) {
        if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
            throw new Error("Invalid Category Status");
        }
    }

    return data;
};

const checkNameAvailability = async (
    name,
    currentCategoryId = null
) => {
    const existingCategory = await categoryRepository.findByName(name);

    if (
        existingCategory &&
        Number(existingCategory.id) !== Number(currentCategoryId)
    ) {
        throw new Error("Category Name Already Exists");
    }
};

// -------------------- Create Category --------------------

const createCategory = async (data) => {
    const validatedData = validateCategoryData(data);

    await checkNameAvailability(validatedData.name);

    try {
        return await categoryRepository.createCategory(validatedData);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            throw new Error("Category Name Already Exists");
        }

        throw error;
    }
};

// -------------------- Get All Categories --------------------

const getAllCategories = async (options = {}) => {
    const { activeOnly = false, limit, offset } = options;

    if (
        limit !== undefined &&
        (
            !Number.isSafeInteger(Number(limit)) ||
            Number(limit) < 1 ||
            Number(limit) > 100
        )
    ) {
        throw new Error("Valid Category Limit Is Required");
    }

    if (
        offset !== undefined &&
        (
            !Number.isSafeInteger(Number(offset)) ||
            Number(offset) < 0
        )
    ) {
        throw new Error("Valid Category Offset Is Required");
    }

    return await categoryRepository.getAllCategories({
        activeOnly,
        ...(limit !== undefined && { limit: Number(limit) }),
        ...(offset !== undefined && { offset: Number(offset) }),
    });
};

// -------------------- Get One Category --------------------

const getOneCategory = async (id) => {
    const categoryId = validateCategoryId(id);

    const category = await categoryRepository.getOneCategory(categoryId);

    if (!category) {
        throw new Error("Category Not Found");
    }

    return category;
};

// -------------------- Update Category --------------------

const updateCategory = async (id, data) => {
    const categoryId = validateCategoryId(id);
    const validatedData = validateCategoryData(data, true);

    const category = await categoryRepository.getOneCategory(categoryId);

    if (!category) {
        throw new Error("Category Not Found");
    }

    if (
        validatedData.name &&
        validatedData.name !== category.name
    ) {
        await checkNameAvailability(validatedData.name, categoryId);
    }

    try {
        const updatedCategory = await categoryRepository.updateCategory(
            categoryId,
            validatedData
        );

        if (!updatedCategory) {
            throw new Error("Category Not Found");
        }

        return updatedCategory;
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            throw new Error("Category Name Already Exists");
        }

        throw error;
    }
};

// -------------------- Deactivate Category --------------------

const deactivateCategory = async (id) => {
    const categoryId = validateCategoryId(id);

    const category = await categoryRepository.getOneCategory(categoryId);

    if (!category) {
        throw new Error("Category Not Found");
    }

    if (category.status === "INACTIVE") {
        throw new Error("Category Is Already Inactive");
    }

    return await categoryRepository.deactivateCategory(categoryId);
};

export {
    createCategory,
    getAllCategories,
    getOneCategory,
    updateCategory,
    deactivateCategory,
};