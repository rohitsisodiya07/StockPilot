import * as model from "@/Model/index";

// Find role by name
const findByName = async (name) => {
    return await model.Role.findOne({
        where: { name },
    });
};

// Create role
const createRole = async (data) => {
    return await model.Role.create(data);
};

// Get all roles
const getAllRoles = async () => {
    return await model.Role.findAll({
        order: [["id", "ASC"]],
    });
};

// Get one role by ID
const getOneRole = async (id) => {
    return await model.Role.findByPk(id);
};

// Update role
const updateRole = async (id, data) => {
    const role = await model.Role.findByPk(id);

    if (!role) {
        return null;
    }

    return await role.update(data);
};

// Delete role
const deleteRole = async (id) => {
    const role = await model.Role.findByPk(id);

    if (!role) {
        return null;
    }

    await role.destroy();

    return role;
};

export {
    createRole,
    findByName,
    getAllRoles,
    getOneRole,
    updateRole,
    deleteRole,
};
