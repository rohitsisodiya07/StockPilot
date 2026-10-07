import * as model from "@/Model/index";

// Find user by email
const findByEmail = async (email) => {
    return await model.User.findOne({
        where: {
            email,
        },
    });
};

// Find user by ID
const getOneUser = async (id) => {
    return await model.User.findByPk(id);
};

// Create user
const createUser = async (data) => {
    return await model.User.create(data);
};

// Get all users
const getAllUsers = async () => {
    return await model.User.findAll({
        attributes: {
            exclude: ["password"],
        },
    });
};

// Update user
const updateUser = async (id, data) => {
    const user = await model.User.findByPk(id);

    if (!user) {
        return null;
    }

    return await user.update(data);
};

// Delete user
const deleteUser = async (id) => {
    const user = await model.User.findByPk(id);

    if (!user) {
        return null;
    }

    await user.destroy();

    return user;
};

export {
    findByEmail,
    getOneUser,
    createUser,
    getAllUsers,
    updateUser,
    deleteUser,
};