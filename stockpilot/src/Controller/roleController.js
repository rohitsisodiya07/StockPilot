import * as roleService from "@/Service/roleService";

const parseRoleId = (id) => {
    const roleId = Number(id);

    if (!Number.isInteger(roleId) || roleId <= 0) {
        throw new Error("Invalid Role ID");
    }

    return roleId;
};

const handleError = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error?.message || "";

    let status = 500;

    if (
        message === "Invalid Role ID" ||
        message === "Role Name is Required" ||
        message === "Invalid Role Name"
    ) {
        status = 400;
    } else if (
        message === "Role Not Found" ||
        message === "No Roles Found"
    ) {
        status = 404;
    } else if (
        message.includes("already exists") ||
        message.includes("Duplicate") ||
        message.includes("Validation error")
    ) {
        status = 409;
    }

    return Response.json(
        {
            success: false,
            message:
                status === 500
                    ? "Internal Server Error"
                    : message,
        },
        { status }
    );
};

// -------------------- Create Role --------------------

const createRole = async (request) => {
    try {
        const body = await request.json();

        if (
            typeof body?.name !== "string" ||
            !body.name.trim()
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Role Name is Required",
                },
                { status: 400 }
            );
        }

        const name = body.name.trim().toUpperCase();

        const role = await roleService.createRole({ name });

        return Response.json(
            {
                success: true,
                message: "Role Created Successfully",
                data: role,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleError(error, "Create Role");
    }
};

// -------------------- Get All Roles --------------------

const getAllRoles = async () => {
    try {
        const roles = await roleService.getAllRoles();

        return Response.json(
            {
                success: true,
                message: roles.length
                    ? "Roles Fetched Successfully"
                    : "No Roles Found",
                data: roles,
            },
            { status: 200 }
        );
    } catch (error) {
        return handleError(error, "Get Roles");
    }
};

// -------------------- Get One Role --------------------

const getOneRole = async (id) => {
    try {
        const roleId = parseRoleId(id);
        const role = await roleService.getOneRole(roleId);

        if (!role) {
            return Response.json(
                {
                    success: false,
                    message: "Role Not Found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Role Fetched Successfully",
                data: role,
            },
            { status: 200 }
        );
    } catch (error) {
        return handleError(error, "Get Role");
    }
};

// -------------------- Update Role --------------------

const updateRole = async (request, id) => {
    try {
        const roleId = parseRoleId(id);
        const body = await request.json();

        if (
            typeof body?.name !== "string" ||
            !body.name.trim()
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Role Name is Required",
                },
                { status: 400 }
            );
        }

        const role = await roleService.updateRole(roleId, {
            name: body.name.trim().toUpperCase(),
        });

        if (!role) {
            return Response.json(
                {
                    success: false,
                    message: "Role Not Found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Role Updated Successfully",
                data: role,
            },
            { status: 200 }
        );
    } catch (error) {
        return handleError(error, "Update Role");
    }
};

// -------------------- Delete Role --------------------

const deleteRole = async (id) => {
    try {
        const roleId = parseRoleId(id);
        const role = await roleService.deleteRole(roleId);

        if (!role) {
            return Response.json(
                {
                    success: false,
                    message: "Role Not Found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Role Deleted Successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        return handleError(error, "Delete Role");
    }
};

export {
    createRole,
    getAllRoles,
    getOneRole,
    updateRole,
    deleteRole,
};