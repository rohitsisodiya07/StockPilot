import sequelize from "@/lib/db/sequelize";
import * as model from "@/Model/index";
import * as stockMovementRepository from "@/Repository/stockMovementRepository";
import * as inventoryRepository from "@/Repository/inventoryRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

const createStockMovement = async (
    userId,
    roleId,
    inventoryId,
    type,
    quantity,
    note
) => {
    if (!["IN", "OUT"].includes(type)) {
        throw new Error("Invalid Stock Movement Type");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity Must Be A Positive Integer");
    }

    const existingInventory =
        await inventoryRepository.getOneInventory(inventoryId);

    if (!existingInventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        existingInventory.warehouseId
    );

    // Ensures stock updates and movement records succeed together.
    return await sequelize.transaction(async (transaction) => {
        const inventory = await model.Inventory.findByPk(inventoryId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!inventory) {
            throw new Error("Inventory Not Found");
        }

        let newQuantity = inventory.quantity;

        if (type === "IN") {
            newQuantity += quantity;
        } else {
            if (quantity > newQuantity) {
                throw new Error("Insufficient Stock");
            }

            newQuantity -= quantity;
        }

        await inventory.update(
            { quantity: newQuantity },
            { transaction }
        );

        return await stockMovementRepository.createStockMovement(
            {
                inventoryId,
                type,
                quantity,
                note,
                userId,
            },
            transaction
        );
    });
};

const getInventoryMovements = async (userId, roleId, inventoryId) => {
    const inventory =
        await inventoryRepository.getOneInventory(inventoryId);

    if (!inventory) {
        throw new Error("Inventory Not Found");
    }

    await userWarehouseService.checkWarehouseAccess(
        userId,
        roleId,
        inventory.warehouseId
    );

    return await stockMovementRepository.getInventoryMovements(inventoryId);
};

export {
    createStockMovement,
    getInventoryMovements,
};
