import * as roleRepository from "@/Repository/roleRepository";

const createRole = async (data) => {
    const existingRole = await roleRepository.findByName(data.name);

    if (existingRole) {
        throw new Error("Role Already Exists");
    }

    return await roleRepository.createRole(data);
};

const getAllRoles = async () => {
    const getData = await roleRepository.getAllRoles();

    if (!getData) {
        throw new Error('Error Occur in Get All');
    }
    return getData;
}

const getOneRole = async (id) => {
    const role = await roleRepository.getOneRole(id);

    if (!role) {
        throw new Error("Role Not Found");
    }

    return role;
};

const updateRole = async (id, data) => {
    const role = await roleRepository.getOneRole(id);

    if (!role) {
        throw new Error("Role Not Found");
    }

    const existingRole = await roleRepository.findByName(data.name);

    if (existingRole && existingRole.id !== Number(id)) {
        throw new Error("Role Already Exists");
    }

    return await roleRepository.updateRole(id, data);
};

const deleteRole = async (id) => {
    const role = await roleRepository.getOneRole(id);

    if (!role) {
        throw new Error("Role Not Found");
    }

    return await roleRepository.deleteRole(id);
};

export {
    createRole,
    getAllRoles,
    getOneRole,
    updateRole,
    deleteRole
};