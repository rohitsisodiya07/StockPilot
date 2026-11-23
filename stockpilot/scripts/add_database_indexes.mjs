import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function run() {
    console.log("Starting Database Index Migration...");

    // Read .env.local manually
    const envPath = path.resolve(process.cwd(), ".env.local");
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
    const envVars = {};
    for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length) {
            envVars[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
        }
    }

    const host = envVars.DB_HOST || "127.0.0.1";
    const user = envVars.DB_USER || "root";
    const password = envVars.DB_PASSWORD || "";
    const database = envVars.DB_NAME || "stockpilot";
    const port = Number(envVars.DB_PORT) || 3306;

    console.log(`Connecting to MySQL at ${host}:${port}/${database}...`);
    const connection = await createConnection({ host, user, password, database, port });

    const indexes = [
        // stock_movements
        { table: "stock_movements", name: "idx_stock_movements_inventory_id", cols: "(inventoryId)" },
        { table: "stock_movements", name: "idx_stock_movements_user_id", cols: "(userId)" },
        { table: "stock_movements", name: "idx_stock_movements_created_at", cols: "(createdAt)" },
        { table: "stock_movements", name: "idx_stock_movements_inv_created", cols: "(inventoryId, createdAt)" },
        { table: "stock_movements", name: "idx_stock_movements_type_created", cols: "(type, createdAt)" },

        // sales_orders
        { table: "sales_orders", name: "idx_sales_orders_status_warehouse", cols: "(status, warehouseId)" },
        { table: "sales_orders", name: "idx_sales_orders_created_at", cols: "(createdAt)" },
        { table: "sales_orders", name: "idx_sales_orders_warehouse_id", cols: "(warehouseId)" },
        { table: "sales_orders", name: "idx_sales_orders_created_by", cols: "(createdBy)" },

        // purchase_orders
        { table: "purchase_orders", name: "idx_purchase_orders_status_warehouse", cols: "(status, warehouseId)" },
        { table: "purchase_orders", name: "idx_purchase_orders_supplier_id", cols: "(supplierId)" },
        { table: "purchase_orders", name: "idx_purchase_orders_created_at", cols: "(createdAt)" },

        // inventory
        { table: "inventory", name: "idx_inventory_warehouse_id", cols: "(warehouseId)" },
        { table: "inventory", name: "idx_inventory_product_id", cols: "(productId)" },
        { table: "inventory", name: "idx_inventory_warehouse_qty", cols: "(warehouseId, quantity)" },

        // user_warehouses
        { table: "user_warehouses", name: "idx_user_warehouses_warehouse_id", cols: "(warehouseId)" },
    ];

    for (const item of indexes) {
        try {
            // Check if index already exists
            const [rows] = await connection.query(
                `SHOW INDEX FROM \`${item.table}\` WHERE Key_name = ?`,
                [item.name]
            );

            if (rows.length > 0) {
                console.log(`[ALREADY EXISTS] ${item.table} -> ${item.name}`);
            } else {
                console.log(`[CREATING] ${item.table} -> ${item.name} on ${item.cols}...`);
                await connection.query(
                    `CREATE INDEX \`${item.name}\` ON \`${item.table}\` ${item.cols}`
                );
                console.log(`[CREATED] Successfully added ${item.name}`);
            }
        } catch (err) {
            console.error(`[ERROR] ${item.table} -> ${item.name}:`, err.message);
        }
    }

    await connection.end();
    console.log("Database Index Migration Finished Successfully!");
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
