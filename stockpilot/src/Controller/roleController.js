import * as roleService from "@/Service/roleService";

const createRole = async (request) => {
    try {
        const body = await request.json();

        const { name } = body;

        if (!name || !name.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Role Name is Required",
                },
                { status: 400 }
            );
        }

        const role = await roleService.createRole({
            name: name.trim().toUpperCase(),
        });

        return Response.json(
            {
                success: true,
                message: "Role Created Successfully",
                data: role,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Role Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

const getAllRoles = async () => {
    try {
        const roles = await roleService.getAllRoles();

        if (!roles || roles.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "No Roles Found",
                    data: [],
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Roles Fetched Successfully",
                data: roles,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get Roles Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

const getOneRole = async (id) => {
    try {
        if (!id) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid ID",
                },
                { status: 400 }
            );
        }

        const role = await roleService.getOneRole(id);

        return Response.json(
            {
                success: true,
                message: "Role Fetched Successfully",
                data: role,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get Role Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
};

const updateRole = async (request, id) => {
    try {
        const body = await request.json();

        const { name } = body;

        if (!name || !name.trim()) {
            return Response.json(
                {
                    success: false,
                    message: "Role Name is Required",
                },
                { status: 400 }
            );
        }

        const role = await roleService.updateRole(id, {
            name: name.trim().toUpperCase(),
        });

        return Response.json(
            {
                success: true,
                message: "Role Updated Successfully",
                data: role,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update Role Error:", error);

        return Response.json(
            {
                success: false,
                message: error.message,
            },
            { status: 400 }
        );
    }
};

const deleteRole = async (id) => {
    try {
        await roleService.deleteRole(id);

        return Response.json(
            {
                success: true,
                message: "Role Deleted Successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Delete Role Error:", error);

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
    createRole,
    getAllRoles,
    getOneRole,
    updateRole,
    deleteRole

};