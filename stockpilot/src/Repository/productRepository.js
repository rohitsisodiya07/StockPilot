import * as model from "@/Model/index";

// duplicate SKU check karne ke liye.
const findBySKU = async (sku) => {
    return await model.Product.findOne({
        where: {
            sku,
        },
    });
};

//Create Product
const createProduct = async (data) => {
    return await model.Product.create(data);
};

//Fetching All Product
const getAllProducts = async () => {
    return await model.Product.findAll();
};

//Fetch One Product Based on ID
const getOneProduct = async (id) => {
    return await model.Product.findByPk(id);
};

//Update Existing Product
const updateProduct = async (id, data) => {
    const product = await model.Product.findByPk(id);

    if (!product) {
        return null;
    }

    return await product.update(data);
};

//Delete Product
const deleteProduct = async (id) => {
    const product = await model.Product.findByPk(id);

    if (!product) {
        return null;
    }

    await product.destroy();

    return product;
};

export {
    findBySKU,
    createProduct,
    getAllProducts,
    getOneProduct,
    updateProduct,
    deleteProduct,
};
