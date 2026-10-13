import * as inventoryService from "@/Service/inventoryService";


const createInventory = async (request, user) => {
    try {
        const body = await request.json();

        const { productId, warehouseId, quantity, reorderLevel } = body;

        if (
            productId === undefined || productId === null || productId === "" ||
            warehouseId === undefined || warehouseId === null || warehouseId === "" ||
            quantity === undefined || quantity === null || quantity === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Product ID, Warehouse ID and Quantity Are Required",
                },
                { status: 400 }
            );
        }

        const parsedProductId = Number(productId);
        const parsedWarehouseId = Number(warehouseId);
        const parsedQuantity = Number(quantity);
        const parsedReorderLevel =
            reorderLevel === undefined ? 10 : Number(reorderLevel);

        if (
            !Number.isInteger(parsedProductId) || parsedProductId <= 0 ||
            !Number.isInteger(parsedWarehouseId) || parsedWarehouseId <= 0 ||
            !Number.isInteger(parsedQuantity) || parsedQuantity < 0 ||
            !Number.isInteger(parsedReorderLevel) || parsedReorderLevel < 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid inventory values",
                },
                { status: 400 }
            );
        }

        const inventory = await inventoryService.createInventory(
            user.id,
            user.roleId,
            {
                productId: parsedProductId,
                warehouseId: parsedWarehouseId,
                quantity: parsedQuantity,
                reorderLevel: parsedReorderLevel,
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
        const parsedWarehouseId = Number(warehouseId);

        if (
            !Number.isInteger(parsedWarehouseId) ||
            parsedWarehouseId <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Warehouse ID",
                },
                { status: 400 }
            );
        }

        const inventory = await inventoryService.getWarehouseInventory(
            user.id,
            user.roleId,
            parsedWarehouseId
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
            error.message.includes("Not Found") ? 404 :
            error.message.includes("Invalid") ? 400 : 500;

        return Response.json(
            {
                success: false,
                message:
                    status === 500
                        ? "Internal Server Error"
                        : error.message,
            },
            { status }
        );
    }
};


const updateInventory = async (request, user, id) => {
    try {
        const inventoryId = Number(id);

        if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Inventory ID",
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Request Body",
                },
                { status: 400 }
            );
        }

        const allowedFields = ["quantity", "reorderLevel"];
        const providedFields = Object.keys(body);

        if (
            providedFields.length === 0 ||
            providedFields.some(
                (field) => !allowedFields.includes(field)
            )
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid or Missing Update Fields",
                },
                { status: 400 }
            );
        }

        const inventory = await inventoryService.updateInventory(
            user.id,
            user.roleId,
            inventoryId,
            {
                quantity:
                    body.quantity === undefined
                        ? undefined
                        : Number(body.quantity),

                reorderLevel:
                    body.reorderLevel === undefined
                        ? undefined
                        : Number(body.reorderLevel),
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
            error.message === "Inventory Not Found" ? 404 :
            error.message.includes("Not Found") ? 404 :
            error.message.includes("Required") ||
            error.message.includes("Non-Negative") ||
            error.message.includes("Invalid") ? 400 : 500;

        return Response.json(
            {
                success: false,
                message:
                    status === 500
                        ? "Internal Server Error"
                        : error.message,
            },
            { status }
        );
    }
};




const deleteInventory = async (user, id) => {
    try {
        const inventoryId = Number(id);

        if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Inventory ID",
                },
                { status: 400 }
            );
        }

        await inventoryService.deleteInventory(
            user.id,
            user.roleId,
            inventoryId
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
            error.message === "Inventory Not Found" ? 404 :
            error.message.includes("Not Found") ? 404 : 500;

        return Response.json(
            {
                success: false,
                message:
                    status === 500
                        ? "Internal Server Error"
                        : error.message,
            },
            { status }
        );
    }
};




const getLowStockInventory = async (user, warehouseId) => {
    try {
        const parsedWarehouseId = Number(warehouseId);

        if (
            !Number.isInteger(parsedWarehouseId) ||
            parsedWarehouseId <= 0
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Warehouse ID",
                },
                { status: 400 }
            );
        }

        const data = await inventoryService.getLowStockInventory(
            user.id,
            user.roleId,
            parsedWarehouseId
        );

        return Response.json({
            success: true,
            message: "Low Stock Inventory Fetched Successfully",
            data,
        });
    } catch (error) {
        console.error("Get Low Stock Inventory Error:", error);

        const status =
            error.message.includes("Access Denied") ? 403 :
            error.message.includes("Not Found") ? 404 :
            error.message.includes("Invalid") ? 400 : 500;

        return Response.json(
            {
                success: false,
                message:
                    status === 500
                        ? "Internal Server Error"
                        : error.message,
            },
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
