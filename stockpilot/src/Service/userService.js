import * as userRepository from "@/Repository/userRepository";
import * as roleRepository from "@/Repository/roleRepository";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

// Create User
const createUser = async (data) => {

    // Check email
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
        throw new Error("Email Already Exists");
    }

    // Check role
    const role = await roleRepository.getOneRole(data.roleId);

    if (!role) {
        throw new Error("Role Not Found");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
        ...data,
        password: hashedPassword,
    };

    const user = await userRepository.createUser(userData);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return userResponse;
};

//login User
const loginUser = async (email, password) => {
    const user = await userRepository.findByEmail(email);

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

    const token = jwt.sign(
        {
            id: user.id,
            roleId: user.roleId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d",
        }
    );

    const userResponse = user.toJSON();

    delete userResponse.password;

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
    if (data.roleId) {

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


// Delete User
const deleteUser = async (id) => {

    const user = await userRepository.getOneUser(id);

    if (!user) {
        throw new Error("User Not Found");
    }

    await userRepository.deleteUser(id);

    return true;
};

export {
    createUser,
    getAllUsers,
    getOneUser,
    updateUser,
    deleteUser,
    loginUser
};