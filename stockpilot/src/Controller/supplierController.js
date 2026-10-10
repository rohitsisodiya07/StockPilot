import * as supplierService from "@/Service/supplierService";

const createSupplier = async (request) => {
    try {
        const body = await request.json();
        const data = await supplierService.createSupplier(body);

        return Response.json({
            success: true,
            message: "Supplier Created Successfully",
            data,
        }, { status: 201 });
    } catch (error) {
        return Response.json({
            success: false,
            message: error.message,
        }, { status: 400 });
    }
};

const getAllSuppliers = async () => {
    try {
        const data = await supplierService.getAllSuppliers();

        return Response.json({
            success: true,
            message: "Suppliers Fetched Successfully",
            data,
        });
    } catch (error) {
        return Response.json({
            success: false,
            message: error.message,
        }, { status: 500 });
    }
};

const getOneSupplier = async (id) => {
    try {
        const data = await supplierService.getOneSupplier(Number(id));

        return Response.json({
            success: true,
            message: "Supplier Fetched Successfully",
            data,
        });
    } catch (error) {
        const status = error.message.includes("Not Found") ? 404 : 400;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};

const updateSupplier = async (request, id) => {
    try {
        const body = await request.json();
        const data = await supplierService.updateSupplier(Number(id), body);

        return Response.json({
            success: true,
            message: "Supplier Updated Successfully",
            data,
        });
    } catch (error) {
        const status = error.message.includes("Not Found") ? 404 : 400;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};

const deleteSupplier = async (id) => {
    try {
        await supplierService.deleteSupplier(Number(id));

        return Response.json({
            success: true,
            message: "Supplier Deleted Successfully",
        });
    } catch (error) {
        const status = error.message.includes("Not Found") ? 404 : 400;

        return Response.json({
            success: false,
            message: error.message,
        }, { status });
    }
};

export {
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
