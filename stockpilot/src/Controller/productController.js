
import * as productService from "@/Service/productService";

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    let status = 500;
    let message = "Internal Server Error";

    if (error.message === "Product Not Found") {
        status = 404;
        message = error.message;
    } else if (
        error.message.includes("Already Exists") ||
        error.message.includes("Duplicate")
    ) {
        status = 409;
        message = error.message;
    } else if (
        error.message.includes("Required") ||
        error.message.includes("Invalid") ||
        error.message.includes("must be") ||
        error.message.includes("Must Be")
    ) {
        status = 400;
        message = error.message;
    }

    return Response.json(
        { success: false, message },
        { status }
    );
};

const validateProductId = (id) => {
    const productId = Number(id);

    return Number.isInteger(productId) && productId > 0
        ? productId
        : null;
};

const createProduct = async (request) => {
    try {
        const body = await request.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return Response.json(
                { success: false, message: "Invalid Request Body" },
                { status: 400 }
            );
        }

        const { name, sku, description, price, status } = body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof sku !== "string" || !sku.trim() ||
            price === undefined || price === null || price === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Name, SKU and Price are Required",
                },
                { status: 400 }
            );
        }

        const parsedPrice = Number(price);

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            return Response.json(
                {
                    success: false,
                    message: "Price Must Be a Non-Negative Number",
                },
                { status: 400 }
            );
        }

        const product = await productService.createProduct({
            name: name.trim(),
            sku: sku.trim(),
            description,
            price: parsedPrice,
            status,
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

const getAllProducts = async () => {
    try {
        const products = await productService.getAllProducts();

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

const getOneProduct = async (id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            { success: false, message: "Invalid Product ID" },
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

const updateProduct = async (request, id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            { success: false, message: "Invalid Product ID" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return Response.json(
                { success: false, message: "Invalid Request Body" },
                { status: 400 }
            );
        }

        const allowedFields = ["name", "sku", "description", "price", "status"];
        const fields = Object.keys(body);

        if (
            fields.length === 0 ||
            fields.some((field) => !allowedFields.includes(field))
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid or Missing Update Fields",
                },
                { status: 400 }
            );
        }

        const updateData = { ...body };

        if (updateData.name !== undefined) {
            if (
                typeof updateData.name !== "string" ||
                !updateData.name.trim()
            ) {
                return Response.json(
                    { success: false, message: "Invalid Product Name" },
                    { status: 400 }
                );
            }

            updateData.name = updateData.name.trim();
        }

        if (updateData.sku !== undefined) {
            if (
                typeof updateData.sku !== "string" ||
                !updateData.sku.trim()
            ) {
                return Response.json(
                    { success: false, message: "Invalid SKU" },
                    { status: 400 }
                );
            }

            updateData.sku = updateData.sku.trim();
        }

        if (updateData.price !== undefined) {
            const parsedPrice = Number(updateData.price);

            if (
                updateData.price === "" ||
                updateData.price === null ||
                !Number.isFinite(parsedPrice) ||
                parsedPrice < 0
            ) {
                return Response.json(
                    {
                        success: false,
                        message: "Price Must Be a Non-Negative Number",
                    },
                    { status: 400 }
                );
            }

            updateData.price = parsedPrice;
        }

        const product = await productService.updateProduct(
            productId,
            updateData
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

const deleteProduct = async (id) => {
    const productId = validateProductId(id);

    if (productId === null) {
        return Response.json(
            { success: false, message: "Invalid Product ID" },
            { status: 400 }
        );
    }

    try {
        await productService.deleteProduct(productId);

        return Response.json(
            {
                success: true,
                message: "Product Deleted Successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Delete Product");
    }
};

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};
