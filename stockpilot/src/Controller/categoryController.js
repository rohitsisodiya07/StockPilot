import * as categoryService from "@/Service/categoryService";

// -------------------- Error Handler --------------------

const sendErrorResponse = (error, action) => {
    console.error(`${action} Category Error:`, error);

    const message = error?.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (message === "Category Not Found") {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Already Exists") ||
        message.includes("Duplicate") ||
        message.includes("Already Inactive")
    ) {
        status = 409;
        responseMessage = message;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Valid")
    ) {
        status = 400;
        responseMessage = message;
    }

    return Response.json(
        {
            success: false,
            message: responseMessage,
        },
        { status }
    );
};

// -------------------- Helpers --------------------

const validateCategoryId = (id) => {
    const categoryId = Number(id);

    return Number.isSafeInteger(categoryId) && categoryId > 0
        ? categoryId
        : null;
};

const parseRequestBody = async (request) => {
    let body;

    try {
        body = await request.json();
    } catch {
        throw new Error("Invalid Request Body");
    }

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        throw new Error("Invalid Request Body");
    }

    return body;
};

// -------------------- Create Category --------------------

const createCategory = async (request) => {
    try {
        const body = await parseRequestBody(request);

        const category = await categoryService.createCategory({
            name: body.name,
            description: body.description,
            ...(body.status !== undefined && {
                status: body.status,
            }),
        });

        return Response.json(
            {
                success: true,
                message: "Category Created Successfully",
                data: category,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create");
    }
};

// -------------------- Get All Categories --------------------

const getAllCategories = async (request) => {
    try {
        const { searchParams } = new URL(request.url);

        const activeOnlyParam = searchParams.get("activeOnly");
        const limitParam = searchParams.get("limit");
        const offsetParam = searchParams.get("offset");

        if (
            activeOnlyParam !== null &&
            !["true", "false"].includes(activeOnlyParam)
        ) {
            throw new Error("Invalid Active Only Filter");
        }

        const options = {
            activeOnly: activeOnlyParam === "true",
        };

        if (limitParam !== null) {
            options.limit = Number(limitParam);
        }

        if (offsetParam !== null) {
            options.offset = Number(offsetParam);
        }

        const categories = await categoryService.getAllCategories(options);

        return Response.json(
            {
                success: true,
                message: "Categories Fetched Successfully",
                data: categories,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Fetch All");
    }
};

// -------------------- Get One Category --------------------

const getOneCategory = async (id) => {
    const categoryId = validateCategoryId(id);

    if (categoryId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Category ID",
            },
            { status: 400 }
        );
    }

    try {
        const category = await categoryService.getOneCategory(categoryId);

        return Response.json(
            {
                success: true,
                message: "Category Fetched Successfully",
                data: category,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Fetch One");
    }
};

// -------------------- Update Category --------------------

const updateCategory = async (request, id) => {
    const categoryId = validateCategoryId(id);

    if (categoryId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Category ID",
            },
            { status: 400 }
        );
    }

    try {
        const body = await parseRequestBody(request);

        const category = await categoryService.updateCategory(
            categoryId,
            { ...body }
        );

        return Response.json(
            {
                success: true,
                message: "Category Updated Successfully",
                data: category,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Update");
    }
};

// -------------------- Deactivate Category --------------------

const deactivateCategory = async (id) => {
    const categoryId = validateCategoryId(id);

    if (categoryId === null) {
        return Response.json(
            {
                success: false,
                message: "Invalid Category ID",
            },
            { status: 400 }
        );
    }

    try {
        const category = await categoryService.deactivateCategory(
            categoryId
        );

        return Response.json(
            {
                success: true,
                message: "Category Deactivated Successfully",
                data: category,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Deactivate");
    }
};

export {
    createCategory,
    getAllCategories,
    getOneCategory,
    updateCategory,
    deactivateCategory,
};