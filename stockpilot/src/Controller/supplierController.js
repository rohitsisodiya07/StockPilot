
import * as supplierService from "@/Service/supplierService";

// -------------------- Error Handler --------------------

const sendErrorResponse = (error, action) => {
    console.error(`${action} Supplier Error:`, error);

    const message = error?.message || "";

    if (message.includes("Not Found")) {
        return Response.json(
            { success: false, message },
            { status: 404 }
        );
    }

    if (
        message.includes("Already Exists") ||
        message.includes("Already Inactive")
    ) {
        return Response.json(
            { success: false, message },
            { status: 409 }
        );
    }

    if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Valid") ||
        message.includes("Too Long") ||
        message.includes("Must Be") ||
        message.includes("must be")
    ) {
        return Response.json(
            { success: false, message },
            { status: 400 }
        );
    }

    return Response.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 }
    );
};

// -------------------- Parse Request Body --------------------

const parseRequestBody = async (request) => {
    let body;

    try {
        body = await request.json();
    } catch {
        throw new Error("Invalid Request Body");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new Error("Invalid Request Body");
    }

    return body;
};

// -------------------- Create Supplier --------------------

const createSupplier = async (request) => {
    try {
        const body = await parseRequestBody(request);
        const data = await supplierService.createSupplier(body);

        return Response.json(
            {
                success: true,
                message: "Supplier Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create");
    }
};

// -------------------- Get All Suppliers --------------------

const getAllSuppliers = async (request) => {
    try {
        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const sortBy = searchParams.get("sortBy");
        const sortOrder = searchParams.get("sortOrder");
        const limit = searchParams.get("limit");
        const offset = searchParams.get("offset");

        const options = {};

        if (search !== null) options.search = search;
        if (status !== null) options.status = status;
        if (sortBy !== null) options.sortBy = sortBy;
        if (sortOrder !== null) options.sortOrder = sortOrder;

        if (limit !== null) {
            options.limit = Number(limit);
        }

        if (offset !== null) {
            options.offset = Number(offset);
        }

        const result = await supplierService.getAllSuppliers(options);

        return Response.json(
            {
                success: true,
                message: "Suppliers Fetched Successfully",
                data: result.suppliers,
                pagination: result.pagination,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Fetch");
    }
};

// -------------------- Get One Supplier --------------------

const getOneSupplier = async (id) => {
    try {
        const data = await supplierService.getOneSupplier(id);

        return Response.json(
            {
                success: true,
                message: "Supplier Fetched Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Fetch One");
    }
};

// -------------------- Update Supplier --------------------

const updateSupplier = async (request, id) => {
    try {
        const body = await parseRequestBody(request);
        const data = await supplierService.updateSupplier(id, body);

        return Response.json(
            {
                success: true,
                message: "Supplier Updated Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Update");
    }
};

// -------------------- Deactivate Supplier --------------------

const deleteSupplier = async (id) => {
    try {
        const data = await supplierService.deleteSupplier(id);

        return Response.json(
            {
                success: true,
                message: "Supplier Deactivated Successfully",
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Deactivate");
    }
};

export {
    createSupplier,
    getAllSuppliers,
    getOneSupplier,
    updateSupplier,
    deleteSupplier,
};
