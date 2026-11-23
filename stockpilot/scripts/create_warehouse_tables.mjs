import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function run() {
    console.log("Starting Warehouse Staff Tables Migration...");

    let envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) {
        envPath = path.resolve(process.cwd(), "stockpilot", ".env.local");
    }
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

    const connection = await createConnection({ host, user, password, database, port });

    // 1. staff_tasks
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`staff_tasks\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`title\` VARCHAR(255) NOT NULL,
            \`description\` TEXT NULL,
            \`assignedTo\` INT NOT NULL,
            \`warehouseId\` INT NULL,
            \`priority\` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
            \`status\` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
            \`createdBy\` INT NULL,
            \`dueAt\` DATETIME NULL,
            \`completedAt\` DATETIME NULL,
            \`completionNotes\` TEXT NULL,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_staff_tasks_assigned_status\` (\`assignedTo\`, \`status\`),
            INDEX \`idx_staff_tasks_warehouse\` (\`warehouseId\`),
            INDEX \`idx_staff_tasks_created_at\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] staff_tasks table verified/created.");

    // 2. staff_shifts
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`staff_shifts\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NOT NULL,
            \`warehouseId\` INT NULL,
            \`clockIn\` DATETIME NOT NULL,
            \`clockOut\` DATETIME NULL,
            \`status\` ENUM('ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
            \`durationMinutes\` INT NOT NULL DEFAULT 0,
            \`notes\` TEXT NULL,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_staff_shifts_user_status\` (\`userId\`, \`status\`),
            INDEX \`idx_staff_shifts_warehouse\` (\`warehouseId\`),
            INDEX \`idx_staff_shifts_clock_in\` (\`clockIn\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] staff_shifts table verified/created.");

    // 3. stock_transfer_requests
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`stock_transfer_requests\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`productId\` INT NOT NULL,
            \`fromWarehouseId\` INT NOT NULL,
            \`toWarehouseId\` INT NOT NULL,
            \`quantity\` INT NOT NULL,
            \`requestedBy\` INT NOT NULL,
            \`priority\` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
            \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
            \`reason\` TEXT NULL,
            \`reviewedBy\` INT NULL,
            \`reviewNotes\` TEXT NULL,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_transfer_req_status\` (\`status\`),
            INDEX \`idx_transfer_req_from_wh\` (\`fromWarehouseId\`),
            INDEX \`idx_transfer_req_to_wh\` (\`toWarehouseId\`),
            INDEX \`idx_transfer_req_user\` (\`requestedBy\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] stock_transfer_requests table verified/created.");

    // 4. return_inspections
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`return_inspections\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`referenceNumber\` VARCHAR(100) NOT NULL,
            \`customerName\` VARCHAR(255) NULL,
            \`productId\` INT NOT NULL,
            \`warehouseId\` INT NOT NULL,
            \`quantity\` INT NOT NULL DEFAULT 1,
            \`condition\` ENUM('GOOD', 'DAMAGED') NOT NULL DEFAULT 'GOOD',
            \`action\` ENUM('RESTOCK', 'SCRAP') NOT NULL DEFAULT 'RESTOCK',
            \`reason\` VARCHAR(255) NULL,
            \`inspectedBy\` INT NOT NULL,
            \`notes\` TEXT NULL,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_return_inspections_wh\` (\`warehouseId\`),
            INDEX \`idx_return_inspections_prod\` (\`productId\`),
            INDEX \`idx_return_inspections_user\` (\`inspectedBy\`),
            INDEX \`idx_return_inspections_date\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] return_inspections table verified/created.");

    await connection.end();
    console.log("Warehouse migration completed successfully!");
}

run().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
