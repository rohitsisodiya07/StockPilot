import * as userRepository from "@/Repository/userRepository";
import * as roleRepository from "@/Repository/roleRepository";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import sequelize from "@/lib/db/sequelize"
import * as userWarehouseRepository from "@/Repository/userWarehouseRepository";
import * as userWarehouseService from "@/Service/userWarehouseService";

// Create User
const createUser = async (data) => {

    // Check email
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
        throw new Error("Email Already Exists");
    }

    const allowedRoleIds = [4, 5];

    if (!allowedRoleIds.includes(Number(data.roleId))) {
        throw new Error(
            "Only Inventory Manager and Warehouse Staff can be created"
        );
    }

    const role = await roleRepository.getOneRole(data.roleId);

    if (!role) {
        throw new Error("Role Not Found");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
        ...data,
        password: hashedPassword,
        status: data.status || "ACTIVE",
    };

    const user = await userRepository.createUser(userData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
};

const DEMO_ACCOUNTS = {
    "admin@stockpilot.com": { name: "System Administrator", roleId: 1, defaultPass: "admin123" },
    "manager@stockpilot.com": { name: "Inventory Manager", roleId: 4, defaultPass: "manager123" },
    "staff@stockpilot.com": { name: "Warehouse Staff", roleId: 5, defaultPass: "staff123" },
};

//login User

const loginUser = async (email, password) => {
    let user = await userRepository.findByEmail(email);

    // Auto-provision demo profiles if logging in for the first time
    if (!user && DEMO_ACCOUNTS[email] && password === DEMO_ACCOUNTS[email].defaultPass) {
        try {
            const demo = DEMO_ACCOUNTS[email];
            const hashedPassword = await bcrypt.hash(demo.defaultPass, 10);
            user = await userRepository.createUser({
                name: demo.name,
                email,
                password: hashedPassword,
                roleId: demo.roleId,
                status: "ACTIVE",
            });
            if ([4, 5].includes(demo.roleId)) {
                await userWarehouseRepository.createAssignment({
                    userId: user.id,
                    warehouseId: 1,
                });
            }
        } catch (provisionErr) {
            console.error("Demo account auto-provision failed:", provisionErr);
        }
    } else if (user && DEMO_ACCOUNTS[email] && password === DEMO_ACCOUNTS[email].defaultPass) {
        // Ensure demo accounts remain ACTIVE and assigned to warehouse 1
        try {
            if (user.status !== "ACTIVE") {
                await user.update({ status: "ACTIVE" });
            }
            if ([4, 5].includes(Number(user.roleId))) {
                const assignments = await userWarehouseRepository.getUserWarehouses(user.id);
                if (!assignments || assignments.length === 0) {
                    await userWarehouseRepository.createAssignment({
                        userId: user.id,
                        warehouseId: 1,
                    });
                }
            }
        } catch (err) {
            console.error("Demo account verify error:", err.message);
        }
    }

    if (!user) {
        throw new Error("Invalid Email or Password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid Email or Password");
    }

    // Check account status
    if (user.status === "PENDING") {
        throw new Error("Your account is pending Admin approval and warehouse assignment. Please wait for email confirmation.");
    }

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
        throw new Error("Your account is currently inactive. Please contact the administrator.");
    }

    if (user.status === "REJECTED") {
        throw new Error("Your account registration was rejected by the administrator.");
    }

    // Role 4 (Inventory Manager) & Role 5 (Warehouse Staff) must have at least one warehouse assigned to access the system
    if ([4, 5].includes(Number(user.roleId))) {
        const hasWarehouse = user.warehouseAssignments && user.warehouseAssignments.length > 0;
        if (!hasWarehouse) {
            throw new Error("Your account has not been assigned to a warehouse yet. Please contact the administrator.");
        }
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT configuration missing");
    }

    const token = jwt.sign(
        {
            id: user.id,
            roleId: user.roleId,
        },
        secret,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "5d",
        }
    );

    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
    };

    return {
        user: userResponse,
        token,
    };
};


// Get All Users
const getAllUsers = async () => {
    return await userRepository.getAllUsers();
};


// Get One User
const getOneUser = async (id) => {

    const user = await userRepository.getOneUser(id);

    if (!user) {
        throw new Error("User Not Found");
    }

    const userResponse = user.toJSON();

    delete userResponse.password;

    return userResponse;
};


// Update User
const updateUser = async (id, data) => {

    const user = await userRepository.getOneUser(id);

    if (!user) {
        throw new Error("User Not Found");
    }

    // Check email only if email is being changed
    if (data.email) {

        const existingUser = await userRepository.findByEmail(data.email);

        if (
            existingUser &&
            existingUser.id !== Number(id)
        ) {
            throw new Error("Email Already Exists");
        }
    }

    // Check role if roleId is being changed
    if (data.roleId !== undefined) {
        const role = await roleRepository.getOneRole(data.roleId);

        if (!role) {
            throw new Error("Role Not Found");
        }
    }

    // Hash password if password is being updated
    if (data.password) {

        data.password = await bcrypt.hash(
            data.password,
            10
        );
    }

    const updatedUser = await userRepository.updateUser(
        id,
        data
    );

    const userResponse = updatedUser.toJSON();

    delete userResponse.password;

    return userResponse;
};


// Delete User directly and permanently
const deleteUser = async (id) => {
    const user = await userRepository.deleteUser(id);

    if (!user) {
        throw new Error("User Not Found");
    }

    return true;
};

// Constants
const INVENTORY_MANAGER = 4;
const WAREHOUSE_STAFF = 5;


// Get Manager's Assigned Warehouse IDs
const getManagerWarehouseIds = async (managerId) => {
    const assignments = await userWarehouseRepository.getUserWarehouses(
        managerId
    );

    return assignments.map((item) => Number(item.warehouseId));
};


// Verify Manager Access to Staff
const verifyManagerStaffAccess = async (
    managerId,
    staffId,
    warehouseId
) => {
    if (!managerId || !staffId || !warehouseId) {
        throw new Error("Manager, Staff and Warehouse ID are required");
    }

    await userWarehouseService.checkWarehouseAccess(
        managerId,
        INVENTORY_MANAGER,
        warehouseId
    );

    const staff = await userRepository.findStaffInWarehouse(
        staffId,
        [Number(warehouseId)]
    );

    if (!staff) {
        throw new Error("Staff Not Found In Your Warehouse");
    }

    return staff;
};


// Create Staff By Inventory Manager
const createStaffByManager = async (managerId, data) => {
    const { name, email, password, warehouseId } = data;

    if (!name || !email || !password || !warehouseId) {
        throw new Error("Name, Email, Password and Warehouse ID are required");
    }

    if (typeof password !== "string" || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    // Check manager warehouse access
    await userWarehouseService.checkWarehouseAccess(
        managerId,
        INVENTORY_MANAGER,
        warehouseId
    );

    // Check duplicate email
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
        throw new Error("Email Already Exists");
    }

    // Check Staff role exists
    const role = await roleRepository.getOneRole(WAREHOUSE_STAFF);

    if (!role) {
        throw new Error("Warehouse Staff Role Not Found");
    }

    const transaction = await sequelize.transaction();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create staff account
        const staff = await userRepository.createUser(
            {
                name,
                email,
                password: hashedPassword,
                roleId: WAREHOUSE_STAFF,
            },
            transaction
        );

        // Assign staff to manager's warehouse
        await userWarehouseRepository.createAssignment(
            {
                userId: staff.id,
                warehouseId,
            },
            transaction
        );

        await transaction.commit();

        const response = staff.toJSON();
        delete response.password;

        return response;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


// Get Manager's Staff
const getManagerStaff = async (managerId) => {
    const warehouseIds = await getManagerWarehouseIds(managerId);

    if (!warehouseIds.length) {
        return [];
    }

    return await userRepository.getStaffByWarehouse(warehouseIds);
};


// Update Staff By Manager
const updateStaffByManager = async (managerId, staffId, data) => {
    const { warehouseId, name, email, password } = data;

    if (!warehouseId) {
        throw new Error("Warehouse ID is required");
    }

    const staff = await verifyManagerStaffAccess(
        managerId,
        staffId,
        warehouseId
    );

    const updateData = {};

    if (name !== undefined) {
        updateData.name = name;
    }

    if (email !== undefined) {
        const existingUser = await userRepository.findByEmail(email);

        if (existingUser && Number(existingUser.id) !== Number(staffId)) {
            throw new Error("Email Already Exists");
        }

        updateData.email = email;
    }

    if (password !== undefined) {
        if (typeof password !== "string" || password.length < 6) {
            throw new Error("Password must be at least 6 characters");
        }

        updateData.password = await bcrypt.hash(password, 10);
    }

    if (!Object.keys(updateData).length) {
        throw new Error("No valid fields provided for update");
    }

    const updatedStaff = await userRepository.updateUser(
        staffId,
        updateData
    );

    const response = updatedStaff.toJSON();
    delete response.password;

    return response;
};


// Delete Staff By Manager
const deleteStaffByManager = async (
    managerId,
    staffId,
    warehouseId
) => {
    const staff = await verifyManagerStaffAccess(
        managerId,
        staffId,
        warehouseId
    );

    // Check all warehouse assignments of staff
    const assignments = await userWarehouseRepository.getUserWarehouses(
        staffId
    );

    // Do not delete an account assigned to multiple warehouses
    if (assignments.length > 1) {
        throw new Error(
            "Staff Is Assigned To Multiple Warehouses. Contact Admin To Delete This Account."
        );
    }

    const transaction = await sequelize.transaction();

    try {
        // Remove warehouse assignment
        await userWarehouseRepository.deleteAssignment(
            staffId,
            warehouseId,
            transaction
        );

        // Soft delete account (User model has paranoid: true)
        await staff.destroy({ transaction });

        await transaction.commit();

        return true;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export {
    createUser,
    getAllUsers,
    getOneUser,
    updateUser,
    deleteUser,
    loginUser,
    createStaffByManager,
    getManagerStaff,
    updateStaffByManager,
    deleteStaffByManager
};