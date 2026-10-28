import * as stockMovementService from "@/Service/stockMovementService";

// -------------------- Helpers --------------------

const parsePositiveInteger = (value) => {
    const number = Number(value);

    if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isInteger(number) ||
        number <= 0
    ) {
        return null;
    }

    return number;
};

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error?.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (message.includes("Access Denied")) {
        status = 403;
        responseMessage = message;
    } else if (
        message.includes("Not Found")
    ) {
        status = 404;
        responseMessage = message;
    } else if (
        error?.name === "SequelizeUniqueConstraintError" ||
        error?.name === "SequelizeForeignKeyConstraintError"
    ) {
        status = 409;
        responseMessage = "Database Conflict";
    } else if (
        error?.name === "SequelizeValidationError" ||
        error?.name === "SequelizeDatabaseError" ||
        message.includes("Invalid") ||
        message.includes("Required") ||
        message.includes("Must") ||
        message.includes("Insufficient") ||
        message.includes("Cannot") ||
        message.includes("Only")
    ) {
        status = 400;
        responseMessage = message;
    }

    return Response.json(
        {
            success: false,
            message: responseMessage,
        },
        { status }
    );
};

// -------------------- Create Stock Movement --------------------

const createStockMovement = async (request, user) => {
    try {
        let body;

        try {
            body = await request.json();
        } catch {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Request Body",
                },
                { status: 400 }
            );
        }

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

        const { inventoryId, type, quantity, note } = body;

        if (
            inventoryId === undefined ||
            inventoryId === null ||
            inventoryId === "" ||
            type === undefined ||
            type === null ||
            type === "" ||
            quantity === undefined ||
            quantity === null ||
            quantity === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Inventory ID, Type and Quantity Are Required",
                },
                { status: 400 }
            );
        }

        const parsedInventoryId = parsePositiveInteger(inventoryId);
        const parsedQuantity = parsePositiveInteger(quantity);

        if (parsedInventoryId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Inventory ID",
                },
                { status: 400 }
            );
        }

        if (parsedQuantity === null) {
            return Response.json(
                {
                    success: false,
                    message: "Quantity Must Be a Positive Integer",
                },
                { status: 400 }
            );
        }

        if (
            typeof type !== "string" ||
            !["IN", "OUT"].includes(type.toUpperCase())
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Type Must Be IN or OUT",
                },
                { status: 400 }
            );
        }

        if (
            note !== undefined &&
            note !== null &&
            (
                typeof note !== "string" ||
                note.length > 255
            )
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Note Must Be a String With At Most 255 Characters",
                },
                { status: 400 }
            );
        }

        const data = await stockMovementService.createStockMovement(
            user.id,
            user.roleId,
            parsedInventoryId,
            type.toUpperCase(),
            parsedQuantity,
            note?.trim() || null
        );

        return Response.json(
            {
                success: true,
                message: "Stock Movement Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create Stock Movement");
    }
};

// -------------------- Get Inventory Movements --------------------

const getInventoryMovements = async (user, inventoryId) => {
    try {
        const parsedInventoryId = parsePositiveInteger(inventoryId);

        if (parsedInventoryId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Inventory ID",
                },
                { status: 400 }
            );
        }

        const data = await stockMovementService.getInventoryMovements(
            user.id,
            user.roleId,
            parsedInventoryId
        );

        return Response.json(
            {
                success: true,
                message: "Stock Movements Fetched Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Inventory Movements");
    }
};

export {
    createStockMovement,
    getInventoryMovements,
};