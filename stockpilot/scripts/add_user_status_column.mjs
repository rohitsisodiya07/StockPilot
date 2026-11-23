import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function run() {
    console.log("Checking and migrating `status` column on `users` table...");

    let envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) {
        envPath = path.resolve(process.cwd(), "stockpilot", ".env.local");
    }
    const envContent = fs.readFileSync(envPath, "utf-8");
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

    // Check if `status` column exists
    const [cols] = await connection.query("SHOW COLUMNS FROM `users` LIKE 'status'");
    if (cols.length === 0) {
        console.log("Adding `status` column to `users` table...");
        await connection.query(`
            ALTER TABLE \`users\`
            ADD COLUMN \`status\` ENUM('ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE'
            AFTER \`roleId\`;
        `);
        console.log("[OK] `status` column added.");
    } else {
        console.log("[OK] `status` column already exists.");
    }

    // Set all existing users to ACTIVE
    await connection.query("UPDATE `users` SET `status` = 'ACTIVE' WHERE `status` IS NULL");
    console.log("[OK] Existing users status set to ACTIVE.");

    // Add index on status if not exists
    try {
        await connection.query("CREATE INDEX `idx_users_status` ON `users` (`status`)");
        console.log("[OK] Index `idx_users_status` created.");
    } catch (e) {
        if (!e.message.includes("Duplicate key name")) {
            console.warn("Index warning:", e.message);
        }
    }

    await connection.end();
    console.log("User status migration completed successfully!");
}

run().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
