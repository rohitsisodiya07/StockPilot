import * as productRepository from "@/Repository/productRepository";
import * as categoryRepository from "@/Repository/categoryRepository";

// -------------------- Helpers --------------------

const validateProductId = (id) => {
    const productId = Number(id);

    if (
        id === undefined ||
        id === null ||
        id === "" ||
        !Number.isSafeInteger(productId) ||
        productId <= 0
    ) {
        throw new Error("Valid Product ID Is Required");
    }

    return productId;
};

const validateProductData = (data, isUpdate = false) => {
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        throw new Error("Invalid Product Data");
    }

    const allowedFields = [
        "name",
        "sku",
        "description",
        "price",
        "status",
        "categoryId",
    ];

    const fields = Object.keys(data);

    if (
        fields.length === 0 ||
        fields.some((field) => !allowedFields.includes(field))
    ) {
        throw new Error("Invalid or Missing Product Fields");
    }

    if (!isUpdate || "name" in data) {
        if (
            typeof data.name !== "string" ||
            data.name.trim().length < 2 ||
            data.name.trim().length > 255
        ) {
            throw new Error("Valid Product Name Is Required");
        }

        data.name = data.name.trim();
    }

    if (!isUpdate || "sku" in data) {
        if (
            typeof data.sku !== "string" ||
            !/^[a-zA-Z0-9_-]{1,100}$/.test(data.sku.trim())
        ) {
            throw new Error("Valid Product SKU Is Required");
        }

        data.sku = data.sku.trim();
    }

    if ("description" in data) {
        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {
            throw new Error("Invalid Product Description");
        }
    }

    if (!isUpdate || "price" in data) {
        if (
            data.price === undefined ||
            data.price === null ||
            data.price === "" ||
            !/^\d+(\.\d{1,2})?$/.test(String(data.price)) ||
            !Number.isFinite(Number(data.price)) ||
            Number(data.price) < 0 ||
            Number(data.price) > 99999999.99
        ) {
            throw new Error("Valid Product Price Is Required");
        }

        data.price = Number(data.price).toFixed(2);
    }

    if ("status" in data) {
        if (!["ACTIVE", "INACTIVE"].includes(data.status)) {
            throw new Error("Invalid Product Status");
        }
    }

    if (!isUpdate || "categoryId" in data) {
        const categoryId = Number(data.categoryId);

        if (
            data.categoryId === undefined ||
            data.categoryId === null ||
            data.categoryId === "" ||
            !Number.isSafeInteger(categoryId) ||
            categoryId <= 0
        ) {
            throw new Error("Valid Category ID Is Required");
        }

        data.categoryId = categoryId;
    }

    return data;
};

const validateActiveCategory = async (categoryId) => {
    const category = await categoryRepository.getOneCategory(categoryId);

    if (!category) {
        throw new Error("Category Not Found");
    }

    if (category.status !== "ACTIVE") {
        throw new Error("Category Is Inactive");
    }

    return category;
};

const checkSKUAvailability = async (
    sku,
    currentProductId = null
) => {
    const existingProduct = await productRepository.findBySKU(sku);

    if (
        existingProduct &&
        Number(existingProduct.id) !== Number(currentProductId)
    ) {
        throw new Error("Product SKU Already Exists");
    }
};

// -------------------- Create Product --------------------

const createProduct = async (data) => {
    const validatedData = validateProductData(data);

    await validateActiveCategory(validatedData.categoryId);
    await checkSKUAvailability(validatedData.sku);

    try {
        return await productRepository.createProduct(validatedData);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            throw new Error("Product SKU Already Exists");
        }

        throw error;
    }
};

// -------------------- Get All Products --------------------


const getAllProducts = async (options = {}) => {
    const {
        limit,
        offset,
        search,
        activeOnly,
        categoryId,
    } = options;

    // Validate limit
    if (
        limit !== undefined &&
        (
            !Number.isSafeInteger(Number(limit)) ||
            Number(limit) < 1 ||
            Number(limit) > 100
        )
    ) {
        throw new Error("Valid Product Limit Is Required");
    }

    // Validate offset
    if (
        offset !== undefined &&
        (
            !Number.isSafeInteger(Number(offset)) ||
            Number(offset) < 0
        )
    ) {
        throw new Error("Valid Product Offset Is Required");
    }

    // Validate search
    if (
        search !== undefined &&
        (
            typeof search !== "string" ||
            search.trim().length > 100
        )
    ) {
        throw new Error("Valid Product Search Is Required");
    }

    // Validate activeOnly
    if (
        activeOnly !== undefined &&
        typeof activeOnly !== "boolean"
    ) {
        throw new Error("Valid Active Only Value Is Required");
    }

    // Validate categoryId
    let parsedCategoryId;

    if (categoryId !== undefined) {
        parsedCategoryId = Number(categoryId);

        if (
            categoryId === "" ||
            !Number.isSafeInteger(parsedCategoryId) ||
            parsedCategoryId <= 0
        ) {
            throw new Error("Valid Category ID Is Required");
        }
    }

    return await productRepository.getAllProducts({
        ...(limit !== undefined && {
            limit: Number(limit),
        }),
        ...(offset !== undefined && {
            offset: Number(offset),
        }),
        ...(search?.trim() && {
            search: search.trim(),
        }),
        ...(activeOnly !== undefined && {
            activeOnly,
        }),
        ...(parsedCategoryId !== undefined && {
            categoryId: parsedCategoryId,
        }),
    });
};


// -------------------- Get One Product --------------------

const getOneProduct = async (id) => {
    const productId = validateProductId(id);

    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    return product;
};

// -------------------- Update Product --------------------

const updateProduct = async (id, data) => {
    const productId = validateProductId(id);
    const validatedData = validateProductData(data, true);

    const existingProduct = await productRepository.getOneProduct(productId);

    if (!existingProduct) {
        throw new Error("Product Not Found");
    }

    if (validatedData.categoryId !== undefined) {
        await validateActiveCategory(validatedData.categoryId);
    }

    if (
        validatedData.sku &&
        validatedData.sku !== existingProduct.sku
    ) {
        await checkSKUAvailability(validatedData.sku, productId);
    }

    try {
        const updatedProduct = await productRepository.updateProduct(
            productId,
            validatedData
        );

        if (!updatedProduct) {
            throw new Error("Product Not Found");
        }

        return updatedProduct;
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            throw new Error("Product SKU Already Exists");
        }

        throw error;
    }
};

// -------------------- Deactivate Product --------------------

const deleteProduct = async (id) => {
    const productId = validateProductId(id);

    const product = await productRepository.getOneProduct(productId);

    if (!product) {
        throw new Error("Product Not Found");
    }

    if (product.status === "INACTIVE") {
        throw new Error("Product Is Already Inactive");
    }

    return await productRepository.updateProduct(
        productId,
        { status: "INACTIVE" }
    );
};

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};