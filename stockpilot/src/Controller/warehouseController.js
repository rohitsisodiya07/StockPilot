import * as warehouseService from "@/Service/warehouseService";

// Create Warehouse
const createWarehouse = async (request) => {
    try {
        const body = await request.json();

        const { name, location, address } = body;

        if (!name || !name.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Warehouse Name is Required",
                },
                { status: 400 }
            );
        }

        if (!location || !location.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Location is Required",
                },
                { status: 400 }
            );
        }

        if (!address || !address.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Address is Required",
                },
                { status: 400 }
            );
        }

        const warehouse = await warehouseService.createWarehouse({
            name: name.trim(),
            location: location.trim(),
            address: address.trim(),
        });

        return Response.json(
            {
                success: true,
                message: "Warehouse Created Successfully",
                data: warehouse,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create Warehouse Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

// Get All Warehouses
const getAllWarehouses = async () => {
    try {
        const warehouses = await warehouseService.getAllWarehouses();

        return Response.json(
            {
                success: true,
                message: "Warehouses Fetched Successfully",
                data: warehouses,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get All Warehouses Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

// Get One Warehouse
const getOneWarehouse = async (id) => {
    try {
        const warehouse = await warehouseService.getOneWarehouse(id);

        return Response.json(
            {
                success: true,
                message: "Warehouse Fetched Successfully",
                data: warehouse,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get One Warehouse Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};

// Update Warehouse
const updateWarehouse = async (request, id) => {
    try {
        const body = await request.json();

        const { name, location, address } = body;

        if (name !== undefined && !name.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Warehouse Name is Required",
                },
                { status: 400 }
            );
        }

        if (location !== undefined && !location.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Location is Required",
                },
                { status: 400 }
            );
        }

        if (address !== undefined && !address.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Address is Required",
                },
                { status: 400 }
            );
        }

        const warehouse = await warehouseService.updateWarehouse(id, {
            ...(name !== undefined && { name: name.trim() }),
            ...(location !== undefined && { location: location.trim() }),
            ...(address !== undefined && { address: address.trim() }),
        });

        return Response.json(
            {
                success: true,
                message: "Warehouse Updated Successfully",
                data: warehouse,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Update Warehouse Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};

// Delete Warehouse
const deleteWarehouse = async (id) => {
    try {
        await warehouseService.deleteWarehouse(id);

        return Response.json(
            {
                success: true,
                message: "Warehouse Deleted Successfully",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete Warehouse Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};

export {
    createWarehouse,
    getAllWarehouses,
    getOneWarehouse,
    updateWarehouse,
    deleteWarehouse,
};