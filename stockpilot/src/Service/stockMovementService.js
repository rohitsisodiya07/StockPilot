import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";
import * as stockMovementRepository from "@/Repository/stockMovementRepository";
import * as inventoryRepository from "@/Repository/inventoryRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

// -------------------- Helpers --------------------

const validatePositiveInteger = (value, fieldName) => {
    const number = Number(value);

    if (
        value === undefined ||
        value === null ||
        value === "" ||
        !Number.isInteger(number) ||
        number <= 0
    ) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return number;
};

// -------------------- Create Stock Movement --------------------

const createStockMovement = async (
    userId,
    roleId,
    inventoryId,
    type,
    quantity,
    note
) => {
    const parsedInventoryId = validatePositiveInteger(
        inventoryId,
        "Inventory ID"
    );

    const parsedQuantity = validatePositiveInteger(
        quantity,
        "Quantity"
    );

    if (
        typeof type !== "string" ||
        !["IN", "OUT"].includes(type.toUpperCase())
    ) {
        throw new Error("Invalid Stock Movement Type");
    }

    const movementType = type.toUpperCase();

    if (
        note !== undefined &&
        note !== null &&
        (
            typeof note !== "string" ||
            note.length > 255
        )
    ) {
        throw new Error("Invalid Stock Movement Note");
    }

    const movementNote = note?.trim() || null;

    // Verify inventory exists before checking warehouse access.
    const existingInventory =
        await inventoryRepository.getOneInventory(
            parsedInventoryId
        );

    if (!existingInventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        existingInventory.warehouseId
    );

    // Update inventory and create movement atomically.
    return await sequelize.transaction(async (transaction) => {
        const inventory = await model.Inventory.findByPk(
            parsedInventoryId,
            {
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!inventory) {
            throw new Error("Inventory Not Found");
        }

        const currentQuantity = Number(inventory.quantity);

        if (
            !Number.isSafeInteger(currentQuantity) ||
            currentQuantity < 0
        ) {
            throw new Error("Invalid Inventory Quantity");
        }

        let newQuantity;

        if (movementType === "IN") {
            newQuantity = currentQuantity + parsedQuantity;

            if (!Number.isSafeInteger(newQuantity)) {
                throw new Error("Invalid Inventory Quantity");
            }
        } else {
            if (parsedQuantity > currentQuantity) {
                throw new Error("Insufficient Stock");
            }

            newQuantity = currentQuantity - parsedQuantity;
        }

        await inventory.update(
            { quantity: newQuantity },
            { transaction }
        );

        return await stockMovementRepository.createStockMovement(
            {
                inventoryId: parsedInventoryId,
                type: movementType,
                quantity: parsedQuantity,
                note: movementNote,
                userId,
            },
            transaction
        );
    });
};

// -------------------- Get Inventory Movements --------------------

const getInventoryMovements = async (
    userId,
    roleId,
    inventoryId
) => {
    const parsedInventoryId = validatePositiveInteger(
        inventoryId,
        "Inventory ID"
    );

    const inventory =
        await inventoryRepository.getOneInventory(
            parsedInventoryId
        );

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    return await stockMovementRepository.getInventoryMovements(
        parsedInventoryId
    );
};

export {
    createStockMovement,
    getInventoryMovements,
};