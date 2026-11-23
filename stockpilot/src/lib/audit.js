import AuditLog from "@/Model/auditLogModel";

/**
 * Record an audit log entry in the database.
 * Never throws an error so critical business operations are never blocked.
 */
export async function logAudit({
    userId,
    action,
    entity,
    entityId = null,
    details = null,
    ipAddress = null,
}) {
    try {
        if (!userId || !action || !entity) return null;

        const stringDetails =
            typeof details === "object" && details !== null
                ? JSON.stringify(details)
                : typeof details === "string"
                ? details
                : null;

        return await AuditLog.create({
            userId,
            action,
            entity,
            entityId,
            details: stringDetails,
            ipAddress,
        });
    } catch (err) {
        console.error("[AuditLog Error]", err.message);
        return null;
    }
}
