
import * as purchaseOrderItemService from "@/Service/purchaseOrderItemService";

const MAX_UNIT_PRICE = 99999999.99;
const ALLOWED_SORT_FIELDS = ["id", "quantity", "unitPrice", "createdAt"];
const ALLOWED_SORT_ORDERS = ["ASC", "DESC"];

const sendErrorResponse = (error, action) => {
    console.error(`${action} Error:`, error);

    const message = error?.message || "";

    let status = 500;
    let responseMessage = "Internal Server Error";

    if (
        message.includes("Unauthorized") ||
        message.includes("Invalid or Expired Token")
    ) {
        status = 401;
        responseMessage = message;
    } else if (
        message.includes("Access Denied") ||
        message.includes("Forbidden")
    ) {
        status = 403;
        responseMessage = message;
    } else if (message.includes("Not Found")) {
        status = 404;
        responseMessage = message;
    } else if (
        message.includes("Already") ||
        message.includes("Only") ||
        message.includes("Cannot") ||
        message.includes("Conflict")
    ) {
        status = 409;
        responseMessage = message;
    } else if (
        message.includes("Required") ||
        message.includes("Invalid") ||
        message.includes("Must") ||
        message.includes("Valid") ||
        message.includes("Price") ||
        message.includes("Inactive") ||
        message.includes("Exists")
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

const parsePositiveId = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

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

const createPurchaseOrderItem = async (
    request,
    user,
    purchaseOrderId
) => {
    try {
        const orderId = parsePositiveId(purchaseOrderId);

        if (orderId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order ID",
                },
                { status: 400 }
            );
        }

        const body = await parseRequestBody(request);

        const allowedFields = ["productId", "quantity", "unitPrice"];
        const unknownFields = Object.keys(body).filter(
            (key) => !allowedFields.includes(key)
        );

        if (unknownFields.length > 0) {
            return Response.json(
                {
                    success: false,
                    message: `Unexpected Fields: ${unknownFields.join(", ")}`,
                },
                { status: 400 }
            );
        }

        if (
            body.productId === undefined ||
            body.productId === null ||
            body.productId === "" ||
            body.quantity === undefined ||
            body.quantity === null ||
            body.quantity === "" ||
            body.unitPrice === undefined ||
            body.unitPrice === null ||
            body.unitPrice === ""
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Product ID, Quantity and Unit Price Are Required",
                },
                { status: 400 }
            );
        }

        const productId = parsePositiveId(body.productId);
        const quantity = Number(body.quantity);
        const unitPrice = Number(body.unitPrice);

        if (productId === null) {
            return Response.json(
                { success: false, message: "Invalid Product ID" },
                { status: 400 }
            );
        }

        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return Response.json(
                {
                    success: false,
                    message: "Quantity Must Be a Positive Integer",
                },
                { status: 400 }
            );
        }

        if (
            typeof body.unitPrice !== "number" &&
            typeof body.unitPrice !== "string"
        ) {
            return Response.json(
                { success: false, message: "Invalid Unit Price" },
                { status: 400 }
            );
        }

        if (
            !Number.isFinite(unitPrice) ||
            unitPrice < 0 ||
            unitPrice > MAX_UNIT_PRICE ||
            Math.round(unitPrice * 100) !== unitPrice * 100
        ) {
            return Response.json(
                {
                    success: false,
                    message: "Unit Price Must Be Between 0 and 99999999.99 With At Most Two Decimal Places",
                },
                { status: 400 }
            );
        }

        const data = await purchaseOrderItemService.createPurchaseOrderItem(
            user.id,
            user.roleId,
            orderId,
            {
                productId,
                quantity,
                unitPrice,
            }
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Item Created Successfully",
                data,
            },
            { status: 201 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Create Purchase Order Item");
    }
};

const getPurchaseOrderItems = async (request, user, purchaseOrderId) => {
    try {
        const orderId = parsePositiveId(purchaseOrderId);

        if (orderId === null) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid Purchase Order ID",
                },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search")?.trim() || "";
        const sortBy = searchParams.get("sortBy") || "id";
        const sortOrder = (
            searchParams.get("sortOrder") || "ASC"
        ).toUpperCase();

        const rawLimit = searchParams.get("limit") ?? "10";
        const rawOffset = searchParams.get("offset") ?? "0";

        if (search.length > 100) {
            return Response.json(
                { success: false, message: "Search Must Not Exceed 100 Characters" },
                { status: 400 }
            );
        }

        if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
            return Response.json(
                { success: false, message: "Invalid Purchase Order Item Sort Field" },
                { status: 400 }
            );
        }

        if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
            return Response.json(
                { success: false, message: "Invalid Purchase Order Item Sort Order" },
                { status: 400 }
            );
        }

        if (!/^\d+$/.test(rawLimit)) {
            return Response.json(
                { success: false, message: "Valid Limit Is Required" },
                { status: 400 }
            );
        }

        if (!/^\d+$/.test(rawOffset)) {
            return Response.json(
                { success: false, message: "Valid Offset Is Required" },
                { status: 400 }
            );
        }

        const limit = Number(rawLimit);
        const offset = Number(rawOffset);

        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
            return Response.json(
                { success: false, message: "Limit Must Be Between 1 and 100" },
                { status: 400 }
            );
        }

        if (!Number.isSafeInteger(offset)) {
            return Response.json(
                { success: false, message: "Invalid Offset" },
                { status: 400 }
            );
        }

        const result = await purchaseOrderItemService.getPurchaseOrderItems(
            user.id,
            user.roleId,
            orderId,
            { search, sortBy, sortOrder, limit, offset }
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Items Fetched Successfully",
                data: result.items,
                pagination: {
                    total: result.total,
                    limit,
                    offset,
                    currentPage: Math.floor(offset / limit) + 1,
                    totalPages: Math.ceil(result.total / limit),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error, "Get Purchase Order Items");
    }
};

const deletePurchaseOrderItem = async (
    user,
    purchaseOrderId,
    itemId
) => {
    try {
        const userId = Number(user?.id);
        const roleId = Number(user?.roleId);

        if (
            !Number.isSafeInteger(userId) ||
            userId <= 0 ||
            !Number.isSafeInteger(roleId)
        ) {
            throw new Error("Unauthorized");
        }

        const orderId = Number(purchaseOrderId);
        const parsedItemId = Number(itemId);

        if (!Number.isSafeInteger(orderId) || orderId <= 0) {
            throw new Error("Valid Purchase Order ID Is Required");
        }

        if (
            !Number.isSafeInteger(parsedItemId) ||
            parsedItemId <= 0
        ) {
            throw new Error("Valid Purchase Order Item ID Is Required");
        }

        await purchaseOrderItemService.deletePurchaseOrderItem(
            userId,
            roleId,
            orderId,
            parsedItemId
        );

        return Response.json(
            {
                success: true,
                message: "Purchase Order Item Deleted Successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        return sendErrorResponse(error);
    }
};


export {
    createPurchaseOrderItem,
    getPurchaseOrderItems,
    deletePurchaseOrderItem
};
