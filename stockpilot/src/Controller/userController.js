import * as userService from "@/Service/userService";


// =========================
// CREATE USER
// =========================

const createUser = async (request) => {

    try {

        const body = await request.json();

        const {
            name,
            email,
            password,
            roleId,
        } = body;


        // Name validation
        if (!name || !name.trim()) {

            return Response.json(
                {
                    success: false,
                    message: "Name is Required",
                },
                { status: 400 }
            );
        }


        // Email validation
        if (!email || !email.trim()) {

            return Response.json(
                {
                    success: false,
                    message: "Email is Required",
                },
                { status: 400 }
            );
        }


        // Basic email format
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid Email Format",
                },
                { status: 400 }
            );
        }


        // Password validation
        if (!password) {

            return Response.json(
                {
                    success: false,
                    message: "Password is Required",
                },
                { status: 400 }
            );
        }


        if (password.length < 6) {

            return Response.json(
                {
                    success: false,
                    message:
                        "Password must be at least 6 characters",
                },
                { status: 400 }
            );
        }


        // Role validation
        if (!roleId) {

            return Response.json(
                {
                    success: false,
                    message: "Role ID is Required",
                },
                { status: 400 }
            );
        }


        const numericRoleId = Number(roleId);

        if (!Number.isInteger(numericRoleId)) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid Role ID",
                },
                { status: 400 }
            );
        }


        const user = await userService.createUser({

            name: name.trim(),

            email: email.trim().toLowerCase(),

            password,

            roleId: numericRoleId,

        });


        return Response.json(
            {
                success: true,
                message: "User Created Successfully",
                data: user,
            },
            { status: 201 }
        );

    } catch (error) {

        console.error(
            "Create User Error:",
            error
        );

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};

const loginUser = async (request) => {
    try {
        const body = await request.json();

        const { email, password } = body;

        if (!email || !email.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Email is Required",
                },
                { status: 400 }
            );
        }

        if (!password) {
            return Response.json(
                {
                    success: false,
                    message: "Password is Required",
                },
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
                data: user,
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Login User Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 401 }
        );
    }
};

// =========================
// GET ALL USERS
// =========================

const getAllUsers = async () => {

    try {

        const users =
            await userService.getAllUsers();


        return Response.json(
            {
                success: true,
                message:
                    "Users Fetched Successfully",
                data: users,
            },
            { status: 200 }
        );

    } catch (error) {

        console.error(
            "Get Users Error:",
            error
        );

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};


// =========================
// GET ONE USER
// =========================

const getOneUser = async (id) => {

    try {

        if (!id || !Number.isInteger(Number(id))) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid User ID",
                },
                { status: 400 }
            );
        }


        const user =
            await userService.getOneUser(id);


        return Response.json(
            {
                success: true,
                message:
                    "User Fetched Successfully",
                data: user,
            },
            { status: 200 }
        );

    } catch (error) {

        console.error(
            "Get User Error:",
            error
        );

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
        );
    }
};


// =========================
// UPDATE USER
// =========================

const updateUser = async (request, id) => {

    try {

        if (!id || !Number.isInteger(Number(id))) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid User ID",
                },
                { status: 400 }
            );
        }


        const body = await request.json();

        const {
            name,
            email,
            password,
            roleId,
        } = body;


        const updateData = {};


        // Name
        if (name !== undefined) {

            if (!name.trim()) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "Name cannot be empty",
                    },
                    { status: 400 }
                );
            }

            updateData.name = name.trim();
        }


        // Email
        if (email !== undefined) {

            if (!email.trim()) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "Email cannot be empty",
                    },
                    { status: 400 }
                );
            }


            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email.trim())) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "Invalid Email Format",
                    },
                    { status: 400 }
                );
            }


            updateData.email =
                email.trim().toLowerCase();
        }


        // Password
        if (password !== undefined) {

            if (password.length < 6) {

                return Response.json(
                    {
                        success: false,
                        message:
                            "Password must be at least 6 characters",
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
                    {
                        success: false,
                        message:
                            "Invalid Role ID",
                    },
                    { status: 400 }
                );
            }

            updateData.roleId = numericRoleId;
        }


        if (Object.keys(updateData).length === 0) {

            return Response.json(
                {
                    success: false,
                    message:
                        "No Data Provided For Update",
                },
                { status: 400 }
            );
        }


        const user =
            await userService.updateUser(
                id,
                updateData
            );


        return Response.json(
            {
                success: true,
                message:
                    "User Updated Successfully",
                data: user,
            },
            { status: 200 }
        );

    } catch (error) {

        console.error(
            "Update User Error:",
            error
        );

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};


// =========================
// DELETE USER
// =========================

const deleteUser = async (id) => {

    try {

        if (!id || !Number.isInteger(Number(id))) {

            return Response.json(
                {
                    success: false,
                    message: "Invalid User ID",
                },
                { status: 400 }
            );
        }


        await userService.deleteUser(id);


        return Response.json(
            {
                success: true,
                message:
                    "User Deleted Successfully",
            },
            { status: 200 }
        );

    } catch (error) {

        console.error(
            "Delete User Error:",
            error
        );

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 404 }
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
};