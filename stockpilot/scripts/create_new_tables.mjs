import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function run() {
    console.log("Starting New Tables Migration...");

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

    const connection = await createConnection({ host, user, password, database, port });

    // 1. notifications table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`notifications\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NULL,
            \`roleId\` INT NULL,
            \`type\` ENUM('LOW_STOCK', 'PO_CREATED', 'PO_RECEIVED', 'SO_DISPATCHED', 'TRANSFER', 'INFO', 'WARNING') NOT NULL DEFAULT 'INFO',
            \`title\` VARCHAR(255) NOT NULL,
            \`message\` TEXT NOT NULL,
            \`link\` VARCHAR(255) NULL,
            \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_notifications_user_role\` (\`userId\`, \`roleId\`, \`isRead\`),
            INDEX \`idx_notifications_created_at\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] notifications table verified/created.");

    // 2. audit_logs table
    await connection.query(`
        CREATE TABLE IF NOT EXISTS \`audit_logs\` (
            \`id\` INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NOT NULL,
            \`action\` ENUM('CREATE', 'UPDATE', 'DELETE', 'TRANSFER', 'RECEIVE', 'DISPATCH', 'LOGIN', 'REORDER') NOT NULL,
            \`entity\` VARCHAR(64) NOT NULL,
            \`entityId\` INT NULL,
            \`details\` TEXT NULL,
            \`ipAddress\` VARCHAR(45) NULL,
            \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX \`idx_audit_logs_user_id\` (\`userId\`),
            INDEX \`idx_audit_logs_entity\` (\`entity\`, \`entityId\`),
            INDEX \`idx_audit_logs_created_at\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("[OK] audit_logs table verified/created.");

    await connection.end();
    console.log("Migration finished successfully!");
}

run().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
