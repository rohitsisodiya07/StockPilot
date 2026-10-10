import * as inventoryService from "@/Service/inventoryService";

const createInventory = async (request, user) => {
    try {
        const body = await request.json();

        const { productId, warehouseId, quantity, reorderLevel } = body;

        if (!productId || !warehouseId || quantity === undefined || quantity === null) {
            return Response.json(
                {
                    success: false,
                    message: "Product ID, Warehouse ID and Quantity Are Required",
                },
                { status: 400 }
            );
        }

        const inventory = await inventoryService.createInventory(
            user.id,
            user.roleId,
            {
                productId: Number(productId),
                warehouseId: Number(warehouseId),
                quantity: Number(quantity),
                reorderLevel: reorderLevel === undefined ? 10 : Number(reorderLevel),
            }
        );

        return Response.json(
            {
                success: true,
                message: "Inventory Created Successfully",
                data: inventory,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create Inventory Error:", error);

        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message.includes("Not Found") ? 404 : 400;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};

const getWarehouseInventory = async (user, warehouseId) => {
    try {
        const inventory = await inventoryService.getWarehouseInventory(
            user.id,
            user.roleId,
            Number(warehouseId)
        );

        return Response.json(
            {
                success: true,
                message: "Warehouse Inventory Fetched Successfully",
                data: inventory,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get Warehouse Inventory Error:", error);

        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message.includes("Not Found") ? 404 : 400;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};


const updateInventory = async (request, user, id) => {
    try {
        const body = await request.json();

        const inventory = await inventoryService.updateInventory(
            user.id,
            user.roleId,
            Number(id),
            {
                quantity: body.quantity === undefined ? undefined : Number(body.quantity),
                reorderLevel: body.reorderLevel === undefined ? undefined : Number(body.reorderLevel),
            }
        );

        return Response.json(
            {
                success: true,
                message: "Inventory Updated Successfully",
                data: inventory,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Update Inventory Error:", error);

        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message === "Inventory Not Found" ? 404 : 400;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};


const deleteInventory = async (user, id) => {
    try {
        await inventoryService.deleteInventory(
            user.id,
            user.roleId,
            Number(id)
        );

        return Response.json(
            {
                success: true,
                message: "Inventory Deleted Successfully",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete Inventory Error:", error);

        const status =
            error.message.includes("Access Denied") ? 403 :
                error.message === "Inventory Not Found" ? 404 : 400;

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status }
        );
    }
};


const getLowStockInventory = async (user, warehouseId) => {
    try {
        const data = await inventoryService.getLowStockInventory(
            user.id,
            user.roleId,
            Number(warehouseId)
        );

        return Response.json({
            success: true,
            message: "Low Stock Inventory Fetched Successfully",
            data,
        });
    } catch (error) {
        const status = error.message.includes("Access Denied")
            ? 403
            : error.message.includes("Not Found")
                ? 404
                : 400;

        return Response.json(
            { success: false, message: error.message },
            { status }
        );
    }
};



export {
    createInventory,
    getWarehouseInventory,
    updateInventory,
    deleteInventory,
    getLowStockInventory
};
