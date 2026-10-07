import * as model from "@/Model/index";

const findByName = async (name) => {
    return await model.Role.findOne({
        where: {
            name,
        },
    });
};

const createRole = async (data) => {
    return await model.Role.create(data);
};

const getAllRoles = async () => {
    return await model.Role.findAll();
};

const getOneRole = async (id) => {
    return await model.Role.findByPk(id);
};

const updateRole = async (id, data) => {
    const role = await model.Role.findByPk(id);

    if (!role) {
        return null;
    }

    return await role.update(data);
};

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