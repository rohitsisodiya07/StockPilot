import * as stockMovementService from "@/Service/stockMovementService";

const createStockMovement = async (request, user) => {
    try {
        const body = await request.json();
        const { inventoryId, type, quantity, note } = body;

        if (!inventoryId || !type || quantity === undefined) {
            return Response.json(
                { success: false, message: "Required Fields Missing" },
                { status: 400 }
            );
        }

        const data = await stockMovementService.createStockMovement(
            user.id,
            user.roleId,
            Number(inventoryId),
            type,
            Number(quantity),
            note
        );

        return Response.json({
            success: true,
            message: "Stock Movement Created Successfully",
            data,
        }, { status: 201 });
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

const getInventoryMovements = async (user, inventoryId) => {
    try {
        const data = await stockMovementService.getInventoryMovements(
            user.id,
            user.roleId,
            Number(inventoryId)
        );

        return Response.json({
            success: true,
            message: "Stock Movements Fetched Successfully",
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

export { createStockMovement, getInventoryMovements };
