import * as supplierRepository from "@/Repository/supplierRepository";

const createSupplier = async (data) => {
    const { name, email, phone, address, status } = data;

    if (!name || !phone) {
        throw new Error("Name and Phone Are Required");
    }

    if (email) {
        const existingSupplier = await supplierRepository.getAllSuppliers();

        if (existingSupplier.some((supplier) => supplier.email === email)) {
            throw new Error("Email Already Exists");
        }
    }

    return await supplierRepository.createSupplier({
        name,
        email,
        phone,
        address,
        status,
    });
};

const getAllSuppliers = async () => {
    return await supplierRepository.getAllSuppliers();
};

const getOneSupplier = async (id) => {
    const supplier = await supplierRepository.getOneSupplier(id);

    if (!supplier) {
        throw new Error("Supplier Not Found");
    }

    return supplier;
};

const updateSupplier = async (id, data) => {
    await getOneSupplier(id);

    if (data.email) {
        const suppliers = await supplierRepository.getAllSuppliers();

        if (suppliers.some(
            (supplier) =>
                supplier.email === data.email &&
                supplier.id !== Number(id)
        )) {
            throw new Error("Email Already Exists");
        }
    }

    const updatedSupplier = await supplierRepository.updateSupplier(id, data);

    return updatedSupplier;
};

const deleteSupplier = async (id) => {
    await getOneSupplier(id);

    return await supplierRepository.deleteSupplier(id);
};

export {
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
