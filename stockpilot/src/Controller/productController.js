import * as productService from "@/Service/productService";

// -------------------- Error Handler --------------------

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error?.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (
        message === "Product Not Found" ||
        message === "Category Not Found"
    ) {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Already Exists") ||
        message.includes("Duplicate") ||
        message.includes("Already Inactive")
    ) {
        status = 409;
        responseMessage = message;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Valid") ||
        message.includes("Must Be") ||
        message.includes("must be") ||
        message.includes("Inactive")
    ) {
        status = 400;
        responseMessage = message;
    }

    return Response.json(
        {
            success: false,
            message: responseMessage,
        },
        { status }
    );
};

// -------------------- Helpers --------------------

const validateProductId = (id) => {
    const productId = Number(id);

    return Number.isSafeInteger(productId) && productId > 0
        ? productId
        : null;
};

const parseRequestBody = async (request) => {
    let body;

    try {
        body = await request.json();
    } catch {
        throw new Error("Invalid Request Body");
    }

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new Error("Invalid Request Body");
    }

    return body;
};

// -------------------- Create Product --------------------

const createProduct = async (request) => {
    try {
        const body = await parseRequestBody(request);

        const product = await productService.createProduct({
            name: body.name,
            sku: body.sku,
            description: body.description,
            price: body.price,
            categoryId: body.categoryId,
            ...(body.status !== undefined && {
                status: body.status,
            }),
        });

        return Response.json(
            {
                success: true,
                message: "Product Created Successfully",
                data: product,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create Product");
    }
};

// -------------------- Get All Products --------------------




const getAllProducts = async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const options = {};

        // Search by name or SKU
        const search = searchParams.get("search");

        if (search !== null) {
            options.search = search;
        }

        // Active-only filter
        const activeOnly = searchParams.get("activeOnly");

        if (activeOnly !== null) {
            if (!["true", "false"].includes(activeOnly)) {
                throw new Error("Invalid Active Only Value");
            }

            options.activeOnly = activeOnly === "true";
        }

        // Pagination
        const limit = searchParams.get("limit");
        const offset = searchParams.get("offset");

        if (limit !== null) {
            options.limit = Number(limit);
        }

        if (offset !== null) {
            options.offset = Number(offset);
        }

        // Category filter
        const categoryId = searchParams.get("categoryId");

        if (categoryId !== null) {
            options.categoryId = categoryId;
        }

        const products = await productService.getAllProducts(options);

        return Response.json(
            {
                success: true,
                message: "Products Fetched Successfully",
                data: products,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Products");
    }
};

// -------------------- Get One Product --------------------

const getOneProduct = async (id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Product ID",
            },
            { status: 400 }
        );
    }

    try {
        const product = await productService.getOneProduct(productId);

        return Response.json(
            {
                success: true,
                message: "Product Fetched Successfully",
                data: product,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Product");
    }
};

// -------------------- Update Product --------------------

const updateProduct = async (request, id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Product ID",
            },
            { status: 400 }
        );
    }

    try {
        const body = await parseRequestBody(request);

        const product = await productService.updateProduct(
            productId,
            { ...body }
        );

        return Response.json(
            {
                success: true,
                message: "Product Updated Successfully",
                data: product,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Update Product");
    }
};

// -------------------- Deactivate Product --------------------

const deleteProduct = async (id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Product ID",
            },
            { status: 400 }
        );
    }

    try {
        const product = await productService.deleteProduct(productId);

        return Response.json(
            {
                success: true,
                message: "Product Deactivated Successfully",
                data: product,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Deactivate Product");
    }
};

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};