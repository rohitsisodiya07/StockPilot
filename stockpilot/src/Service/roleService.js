import * as roleRepository from "@/Repository/roleRepository";

// -------------------- Create Role --------------------

const createRole = async (data) => {
    if (
        !data ||
        typeof data.name !== "string" ||
        !data.name.trim()
    ) {
        throw new Error("Role Name is Required");
    }

    const name = data.name.trim().toUpperCase();

    const existingRole = await roleRepository.findByName(name);

    if (existingRole) {
        throw new Error("Role Already Exists");
    }

    return await roleRepository.createRole({ name });
};

// -------------------- Get All Roles --------------------

const getAllRoles = async () => {
    const roles = await roleRepository.getAllRoles();

    if (!Array.isArray(roles)) {
        throw new Error("Failed to Fetch Roles");
    }

    return roles;
};

// -------------------- Get One Role --------------------

const getOneRole = async (id) => {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid Role ID");
    }

    const role = await roleRepository.getOneRole(roleId);

    if (!role) {
        throw new Error("Role Not Found");
    }

    return role;
};

// -------------------- Update Role --------------------

const updateRole = async (id, data) => {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid Role ID");
    }

    if (
        !data ||
        typeof data.name !== "string" ||
        !data.name.trim()
    ) {
        throw new Error("Role Name is Required");
    }

    const role = await roleRepository.getOneRole(roleId);

    if (!role) {
        throw new Error("Role Not Found");
    }

    const name = data.name.trim().toUpperCase();

    const existingRole = await roleRepository.findByName(name);

    if (
        existingRole &&
        Number(existingRole.id) !== roleId
    ) {
        throw new Error("Role Already Exists");
    }

    return await roleRepository.updateRole(roleId, { name });
};

// -------------------- Delete Role --------------------

const deleteRole = async (id) => {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid Role ID");
    }

    const role = await roleRepository.getOneRole(roleId);

    if (!role) {
        throw new Error("Role Not Found");
    }

    return await roleRepository.deleteRole(roleId);
};

export {
    createRole,
    getAllRoles,
    getOneRole,
    updateRole,
    deleteRole,
};