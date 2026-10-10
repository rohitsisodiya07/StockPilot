import * as productRepository from "@/Repository/productRepository";

const createProduct = async (data) => {
    const existingProduct = await productRepository.findBySKU(data.sku);

    if (existingProduct) {
        throw new Error("Product SKU Already Exists");
    }

    return await productRepository.createProduct(data);
};

const getAllProducts = async () => {
    return await productRepository.getAllProducts();
};

const getOneProduct = async (id) => {
    const product = await productRepository.getOneProduct(id);

    if (!product) {
        throw new Error("Product Not Found");
    }

    return product;
};

const updateProduct = async (id, data) => {
    const product = await productRepository.getOneProduct(id);

    if (!product) {
        throw new Error("Product Not Found");
    }

    if (data.sku && data.sku !== product.sku) {
        const existingProduct = await productRepository.findBySKU(data.sku);

        if (existingProduct) {
            throw new Error("Product SKU Already Exists");
        }
    }

    return await productRepository.updateProduct(id, data);
};

const deleteProduct = async (id) => {
    const product = await productRepository.getOneProduct(id);

    if (!product) {
        throw new Error("Product Not Found");
    }

    return await productRepository.deleteProduct(id);
};

export {
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};
