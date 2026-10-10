import * as productService from "@/Service/productService";

const createProduct = async (request) => {
    try {
        const body = await request.json();

        const { name, sku, description, price, status } = body;

        if (!name || !sku || price === undefined || price === null || price === "") {
            return Response.json(
                {
                    success: false,
                    message: "Name, SKU and Price are Required",
                },
                { status: 400 }
            );
        }

        const product = await productService.createProduct({
            name,
            sku,
            description,
            price,
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
        console.error("Create Product Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
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
        console.error("Get Products Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

const getOneProduct = async (id) => {
    try {
        const product = await productService.getOneProduct(Number(id));

        return Response.json(
            {
                success: true,
                message: "Product Fetched Successfully",
                data: product,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get Product Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: error.message === "Product Not Found" ? 404 : 500 }
        );
    }
};

const updateProduct = async (request, id) => {
    try {
        const body = await request.json();

        const { name, sku, description, price, status } = body;

        const product = await productService.updateProduct(
            Number(id),
            { name, sku, description, price, status }
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
        console.error("Update Product Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: error.message === "Product Not Found" ? 404 : 400 }
        );
    }
};

const deleteProduct = async (id) => {
    try {
        await productService.deleteProduct(Number(id));

        return Response.json(
            {
                success: true,
                message: "Product Deleted Successfully",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete Product Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: error.message === "Product Not Found" ? 404 : 400 }
        );
    }
};

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};
