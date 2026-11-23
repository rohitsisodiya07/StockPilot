export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import Product from "@/Model/productModel";
import Category from "@/Model/categoryModel";
import sequelize from "@/lib/db/sequelize";
import { Op } from "sequelize";

// Admins (1) and Inventory Managers (4) can bulk import products
const allowBulkImport = roleMiddleware(1, 4);

export async function POST(request) {
    try {
        await connectDB();

        const user = await authMiddleware(request);
        allowBulkImport(user);

        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json(
                { success: false, message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const rawProducts = Array.isArray(body) ? body : body?.products;

        if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
            return Response.json(
                { success: false, message: "Please provide an array of products to import" },
                { status: 400 }
            );
        }

        if (rawProducts.length > 500) {
            return Response.json(
                { success: false, message: "Maximum 500 products can be imported in a single batch" },
                { status: 400 }
            );
        }

        // Fetch valid category IDs
        const existingCategories = await Category.findAll({ attributes: ["id"] });
        const validCategoryIds = new Set(existingCategories.map((c) => c.id));

        const errors = [];
        const validatedProducts = [];
        const seenSkusInBatch = new Set();

        rawProducts.forEach((item, index) => {
            const rowNum = index + 1;
            const name = typeof item.name === "string" ? item.name.trim() : "";
            const sku = typeof item.sku === "string" ? item.sku.trim().toUpperCase() : "";
            const rawCatId = item.categoryid || item.categoryId;
            const categoryId = Number(rawCatId);
            const price = Number(item.price);
            const description = typeof item.description === "string" ? item.description.trim() : null;
            const status = (item.status || "ACTIVE").toString().toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";

            if (!name || name.length < 2 || name.length > 255) {
                errors.push(`Row ${rowNum}: Name must be between 2 and 255 characters`);
                return;
            }

            if (!sku || !/^[a-zA-Z0-9_-]{1,100}$/.test(sku)) {
                errors.push(`Row ${rowNum}: Invalid SKU '${sku}'. Must be alphanumeric with '-' or '_'`);
                return;
            }

            if (seenSkusInBatch.has(sku)) {
                errors.push(`Row ${rowNum}: Duplicate SKU '${sku}' found in the import batch`);
                return;
            }
            seenSkusInBatch.add(sku);

            if (!Number.isInteger(categoryId) || !validCategoryIds.has(categoryId)) {
                errors.push(`Row ${rowNum}: Category ID '${rawCatId}' does not exist`);
                return;
            }

            if (isNaN(price) || price < 0) {
                errors.push(`Row ${rowNum}: Price must be a non-negative number`);
                return;
            }

            validatedProducts.push({
                name,
                sku,
                categoryId,
                price,
                description,
                status,
            });
        });

        if (errors.length > 0) {
            return Response.json(
                {
                    success: false,
                    message: `Validation failed for ${errors.length} item(s)`,
                    errors: errors.slice(0, 15), // return first 15 errors
                },
                { status: 400 }
            );
        }

        // Check for existing SKUs in database
        const existingInDb = await Product.findAll({
            where: {
                sku: {
                    [Op.in]: Array.from(seenSkusInBatch),
                },
            },
            attributes: ["sku"],
        });

        if (existingInDb.length > 0) {
            const existingList = existingInDb.map((p) => p.sku).slice(0, 10).join(", ");
            return Response.json(
                {
                    success: false,
                    message: `Database conflict: The following SKU(s) already exist in your catalog: ${existingList}`,
                },
                { status: 409 }
            );
        }

        // Transactional bulk insert
        const createdRecords = await sequelize.transaction(async (t) => {
            return await Product.bulkCreate(validatedProducts, { transaction: t });
        });

        return Response.json(
            {
                success: true,
                message: `Successfully imported ${createdRecords.length} product(s)`,
                data: {
                    count: createdRecords.length,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Bulk Product Import API Error:", error);

        const isAuthError = error?.message === "Invalid or Expired Token";
        const isForbidden = error?.message?.includes("Forbidden");

        return Response.json(
            {
                success: false,
                message: isAuthError
                    ? "Invalid or Expired Token"
                    : isForbidden
                    ? "Forbidden: You do not have permission"
                    : error?.message || "Internal Server Error",
            },
            { status: isAuthError ? 401 : isForbidden ? 403 : 500 }
        );
    }
}
