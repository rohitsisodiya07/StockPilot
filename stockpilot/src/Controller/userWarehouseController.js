import * as userWarehouseService from "@/Service/userWarehouseService";

const assignWarehouse = async (request, user) => {
    try {
        if (user.roleId !== 1) {
            return Response.json(
                {
                    success: false,
                    message: "Only Admin Can Assign Warehouse",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const { userId, warehouseId } = body;

        if (!userId) {
            return Response.json(
                {
                    success: false,
                    message: "User ID is Required",
                },
                { status: 400 }
            );
        }

        if (!warehouseId) {
            return Response.json(
                {
                    success: false,
                    message: "Warehouse ID is Required",
                },
                { status: 400 }
            );
        }

        const assignment =
            await userWarehouseService.assignWarehouse(
                Number(userId),
                Number(warehouseId)
            );

        return Response.json(
            {
                success: true,
                message: "Warehouse Assigned Successfully",
                data: assignment,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Assign Warehouse Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};

// Get User Warehouses
const getUserWarehouses = async (request, userId) => {
    try {
        const warehouses =
            await userWarehouseService.getUserWarehouses(userId);

        return Response.json(
            {
                success: true,
                message: "User Warehouses Fetched Successfully",
                data: warehouses,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get User Warehouses Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};

// Get Warehouse Users
const getWarehouseUsers = async (request, warehouseId) => {
    try {
        const users =
            await userWarehouseService.getWarehouseUsers(warehouseId);

        return Response.json(
            {
                success: true,
                message: "Warehouse Users Fetched Successfully",
                data: users,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get Warehouse Users Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};

// Remove User From Warehouse
const removeAssignment = async (request, userId, warehouseId) => {
    try {
        await userWarehouseService.removeAssignment(
            Number(userId),
            Number(warehouseId)
        );

        return Response.json(
            {
                success: true,
                message: "User Removed From Warehouse Successfully",
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Remove Assignment Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};


const assignStaff = async (request, user) => {
    try {
        if (user.roleId !== 4) {
            return Response.json(
                {
                    success: false,
                    message: "Only Inventory Manager Can Assign Staff",
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const { staffId, warehouseId } = body;

        if (!staffId) {
            return Response.json(
                {
                    success: false,
                    message: "Staff ID is Required",
                },
                { status: 400 }
            );
        }

        if (!warehouseId) {
            return Response.json(
                {
                    success: false,
                    message: "Warehouse ID is Required",
                },
                { status: 400 }
            );
        }

        const assignment = await userWarehouseService.assignStaff(
            user.id,
            Number(staffId),
            Number(warehouseId)
        );

        return Response.json(
            {
                success: true,
                message: "Warehouse Staff Assigned Successfully",
                data: assignment,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Assign Staff Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};

const checkWarehouseAccess = async (request, user, warehouseId) => {
    try {
        await userWarehouseService.checkWarehouseAccess(
            user.id,
            user.roleId,
            Number(warehouseId)
        );

        return Response.json({
            success: true,
            message: "Warehouse Access Granted",
        });

    } catch (error) {
        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 403 }
        );
    }
};


export {
    assignWarehouse,
    getUserWarehouses,
    getWarehouseUsers,
    removeAssignment,
    assignStaff,
    checkWarehouseAccess
};