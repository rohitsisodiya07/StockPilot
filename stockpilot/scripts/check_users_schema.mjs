import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";

async function main() {
    let envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath)) envPath = path.resolve(process.cwd(), "stockpilot", ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = {};
    for (const line of envContent.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [k, ...rest] = trimmed.split("=");
        if (k && rest.length) envVars[k.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }

    const conn = await createConnection({
        host: envVars.DB_HOST || "127.0.0.1",
        user: envVars.DB_USER || "root",
        password: envVars.DB_PASSWORD || "",
        database: envVars.DB_NAME || "stockpilot",
        port: Number(envVars.DB_PORT) || 3306,
    });

    const [cols] = await conn.query("DESCRIBE users");
    console.log("USERS COLUMNS:", cols.map((c) => `${c.Field} (${c.Type}, Default: ${c.Default})`));
    await conn.end();
}

main().catch(console.error);
