
import * as userService from "@/Service/userService";
import * as warehouseRepository from "@/Repository/warehouseRepository";
import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import { sendUserCreatedByAdminEmail } from "@/lib/mailer";
import { createNotification } from "@/lib/notifier";
import { invalidateUserAuthCache } from "@/Middleware/authMiddleware";


// =========================
// CREATE USER (ADMIN)
// =========================

const createUser = async (request) => {
    try {
        const body = await request.json();

        const { name, email, password, roleId } = body;

        if (typeof name !== "string" || !name.trim()) {
            return Response.json(
                { success: false, message: "Name is Required" },
                { status: 400 }
            );
        }

        if (typeof email !== "string" || !email.trim()) {
            return Response.json(
                { success: false, message: "Email is Required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return Response.json(
                { success: false, message: "Invalid Email Format" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 6) {
            return Response.json(
                {
                    success: false,
                    message: "Password must be at least 6 characters"
                },
                { status: 400 }
            );
        }

        const numericRoleId = Number(roleId);

        if (!Number.isInteger(numericRoleId)) {
            return Response.json(
                { success: false, message: "Invalid Role ID" },
                { status: 400 }
            );
        }

        const user = await userService.createUser({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            roleId: numericRoleId,
            status: "ACTIVE",
        });

        // Optional warehouse assignment during creation
        const numericWarehouseId = body.warehouseId ? Number(body.warehouseId) : null;
        let warehouseName = "Central Facility";

        if (numericWarehouseId && Number.isInteger(numericWarehouseId) && numericWarehouseId > 0) {
            try {
                const wh = await warehouseRepository.getOneWarehouse(numericWarehouseId);
                if (wh) {
                    await userWarehouseRepository.createAssignment({
                        userId: user.id,
                        warehouseId: numericWarehouseId,
                    });
                    warehouseName = wh.name;
                }
            } catch (whErr) {
                console.error("Failed to assign initial warehouse:", whErr.message);
            }
        }

        const roleName = numericRoleId === 4 ? "Inventory Manager" : "Warehouse Staff";
        const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Dispatch Brevo email with credentials to newly created user
        await sendUserCreatedByAdminEmail({
            to: user.email,
            name: user.name,
            email: user.email,
            password, // Plain password provided by admin
            roleName,
            warehouseName,
            loginUrl,
        });

        // In-app notification for the user
        await createNotification({
            userId: user.id,
            type: "INFO",
            title: "Welcome to StockPilot ERP",
            message: `Your account has been created by the Administrator. Facility: ${warehouseName}.`,
            link: numericRoleId === 4 ? "/manager/dashboard" : "/warehouse/dashboard",
        });

        return Response.json(
            {
                success: true,
                message: `User created successfully and credentials emailed to ${user.email}`,
                data: user
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create User Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


// =========================
// LOGIN USER
// =========================

const loginUser = async (request) => {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (typeof email !== "string" || !email.trim()) {
            return Response.json(
                { success: false, message: "Valid Email is Required" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || !password) {
            return Response.json(
                { success: false, message: "Password is Required" },
                { status: 400 }
            );
        }

        const user = await userService.loginUser(
            email.trim().toLowerCase(),
            password
        );

        return Response.json(
            {
                success: true,
                message: "Login Successfully",
                data: user
            },
            { status: 200 }
        );

    } catch (error) {
        if (error.message === "Invalid Email or Password") {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Email or Password"
                },
                { status: 401 }
            );
        }

        console.warn("Login Authorization Notice:", error.message);

        return Response.json(
            { success: false, message: error.message || "Login failed" },
            { status: 403 }
        );
    }
};


// =========================
// GET ALL USERS (ADMIN)
// =========================

const getAllUsers = async () => {
    try {
        const users = await userService.getAllUsers();

        return Response.json(
            {
                success: true,
                message: "Users Fetched Successfully",
                data: users
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get Users Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
};


// =========================
// GET ONE USER (ADMIN)
// =========================

const getOneUser = async (id) => {
    try {
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return Response.json(
                { success: false, message: "Invalid User ID" },
                { status: 400 }
            );
        }

        const user = await userService.getOneUser(id);

        return Response.json(
            {
                success: true,
                message: "User Fetched Successfully",
                data: user
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get User Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 404 }
        );
    }
};


// =========================
// UPDATE USER (ADMIN)
// =========================

const updateUser = async (request, id) => {
    try {
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return Response.json(
                { success: false, message: "Invalid User ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const { name, email, password, roleId } = body;

        const updateData = {};

        // Name
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return Response.json(
                    { success: false, message: "Name cannot be empty" },
                    { status: 400 }
                );
            }

            updateData.name = name.trim();
        }

        // Email
        if (email !== undefined) {
            if (typeof email !== "string" || !email.trim()) {
                return Response.json(
                    { success: false, message: "Email cannot be empty" },
                    { status: 400 }
                );
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email.trim())) {
                return Response.json(
                    { success: false, message: "Invalid Email Format" },
                    { status: 400 }
                );
            }

            updateData.email = email.trim().toLowerCase();
        }

        // Password
        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 6) {
                return Response.json(
                    {
                        success: false,
                        message: "Password must be at least 6 characters"
                    },
                    { status: 400 }
                );
            }

            updateData.password = password;
        }

        // Role
        if (roleId !== undefined) {
            const numericRoleId = Number(roleId);

            if (!Number.isInteger(numericRoleId)) {
                return Response.json(
                    { success: false, message: "Invalid Role ID" },
                    { status: 400 }
                );
            }

            updateData.roleId = numericRoleId;
        }

        // Status update (ACTIVE, INACTIVE, etc.)
        if (body.status !== undefined) {
            const validStatuses = ["ACTIVE", "INACTIVE", "PENDING", "REJECTED", "SUSPENDED"];
            if (!validStatuses.includes(body.status)) {
                return Response.json(
                    { success: false, message: "Invalid Status value" },
                    { status: 400 }
                );
            }
            updateData.status = body.status;
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "No Data Provided For Update"
                },
                { status: 400 }
            );
        }

        const user = await userService.updateUser(id, updateData);
        invalidateUserAuthCache(id);

        return Response.json(
            {
                success: true,
                message: "User Updated Successfully",
                data: user
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Update User Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


// =========================
// DELETE USER (ADMIN)
// =========================

const deleteUser = async (id) => {
    try {
        if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
            return Response.json(
                { success: false, message: "Invalid User ID" },
                { status: 400 }
            );
        }

        await userService.deleteUser(id);
        invalidateUserAuthCache(id);

        return Response.json(
            {
                success: true,
                message: "User Deleted Successfully"
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete User Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 404 }
        );
    }
};


// ==================================================
// INVENTORY MANAGER - CREATE WAREHOUSE STAFF
// ==================================================

const createStaffByManager = async (request, user) => {
    try {
        if (Number(user?.roleId) !== 4) {
            return Response.json(
                {
                    success: false,
                    message: "Only Inventory Manager Can Create Staff"
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const { name, email, password, warehouseId } = body;

        if (typeof name !== "string" || !name.trim()) {
            return Response.json(
                { success: false, message: "Name is Required" },
                { status: 400 }
            );
        }

        if (typeof email !== "string" || !email.trim()) {
            return Response.json(
                { success: false, message: "Email is Required" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            return Response.json(
                { success: false, message: "Invalid Email Format" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 6) {
            return Response.json(
                {
                    success: false,
                    message: "Password must be at least 6 characters"
                },
                { status: 400 }
            );
        }

        if (!Number.isInteger(Number(warehouseId)) || Number(warehouseId) <= 0) {
            return Response.json(
                { success: false, message: "Invalid Warehouse ID" },
                { status: 400 }
            );
        }

        const staff = await userService.createStaffByManager(
            user.id,
            {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                warehouseId: Number(warehouseId)
            }
        );

        return Response.json(
            {
                success: true,
                message: "Warehouse Staff Created Successfully",
                data: staff
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Create Staff By Manager Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


// ==================================================
// INVENTORY MANAGER - GET OWN WAREHOUSE STAFF
// ==================================================

const getManagerStaff = async (user) => {
    try {
        if (Number(user?.roleId) !== 4) {
            return Response.json(
                {
                    success: false,
                    message: "Only Inventory Manager Can View Staff"
                },
                { status: 403 }
            );
        }

        const staff = await userService.getManagerStaff(user.id);

        return Response.json(
            {
                success: true,
                message: "Warehouse Staff Fetched Successfully",
                data: staff
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Get Manager Staff Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


// ==================================================
// INVENTORY MANAGER - UPDATE OWN WAREHOUSE STAFF
// ==================================================

const updateStaffByManager = async (request, user, staffId) => {
    try {
        if (Number(user?.roleId) !== 4) {
            return Response.json(
                {
                    success: false,
                    message: "Only Inventory Manager Can Update Staff"
                },
                { status: 403 }
            );
        }

        if (!Number.isInteger(Number(staffId)) || Number(staffId) <= 0) {
            return Response.json(
                { success: false, message: "Invalid Staff ID" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const { name, email, password, warehouseId } = body;

        if (!Number.isInteger(Number(warehouseId)) || Number(warehouseId) <= 0) {
            return Response.json(
                { success: false, message: "Valid Warehouse ID is Required" },
                { status: 400 }
            );
        }

        const updateData = {
            warehouseId: Number(warehouseId)
        };

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return Response.json(
                    { success: false, message: "Name cannot be empty" },
                    { status: 400 }
                );
            }

            updateData.name = name.trim();
        }

        if (email !== undefined) {
            if (typeof email !== "string" || !email.trim()) {
                return Response.json(
                    { success: false, message: "Email cannot be empty" },
                    { status: 400 }
                );
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email.trim())) {
                return Response.json(
                    { success: false, message: "Invalid Email Format" },
                    { status: 400 }
                );
            }

            updateData.email = email.trim().toLowerCase();
        }

        if (password !== undefined) {
            if (typeof password !== "string" || password.length < 6) {
                return Response.json(
                    {
                        success: false,
                        message: "Password must be at least 6 characters"
                    },
                    { status: 400 }
                );
            }

            updateData.password = password;
        }

        if (
            name === undefined &&
            email === undefined &&
            password === undefined
        ) {
            return Response.json(
                {
                    success: false,
                    message: "No Data Provided For Update"
                },
                { status: 400 }
            );
        }

        const staff = await userService.updateStaffByManager(
            user.id,
            staffId,
            updateData
        );

        return Response.json(
            {
                success: true,
                message: "Warehouse Staff Updated Successfully",
                data: staff
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Update Staff By Manager Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


// ==================================================
// INVENTORY MANAGER - DELETE OWN WAREHOUSE STAFF
// ==================================================

const deleteStaffByManager = async (user, staffId, warehouseId) => {
    try {
        if (Number(user?.roleId) !== 4) {
            return Response.json(
                {
                    success: false,
                    message: "Only Inventory Manager Can Delete Staff"
                },
                { status: 403 }
            );
        }

        if (!Number.isInteger(Number(staffId)) || Number(staffId) <= 0) {
            return Response.json(
                { success: false, message: "Invalid Staff ID" },
                { status: 400 }
            );
        }

        if (!Number.isInteger(Number(warehouseId)) || Number(warehouseId) <= 0) {
            return Response.json(
                { success: false, message: "Invalid Warehouse ID" },
                { status: 400 }
            );
        }

        await userService.deleteStaffByManager(
            user.id,
            staffId,
            Number(warehouseId)
        );

        return Response.json(
            {
                success: true,
                message: "Warehouse Staff Deleted Successfully"
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Delete Staff By Manager Error:", error);

        return Response.json(
            { success: false, message: error.message },
            { status: 400 }
        );
    }
};


export {
    createUser,
    loginUser,
    getAllUsers,
    getOneUser,
    updateUser,
    deleteUser,

    // Inventory Manager Staff CRUD
    createStaffByManager,
    getManagerStaff,
    updateStaffByManager,
    deleteStaffByManager
};
