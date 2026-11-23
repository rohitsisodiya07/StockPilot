export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import roleMiddleware from "@/Middleware/roleMiddleware";
import AuditLog from "@/Model/auditLogModel";
import User from "@/Model/userModel";
import { Op } from "sequelize";

const allowAdmin = roleMiddleware(1);

export async function GET(request) {
    try {
        await connectDB();
        const user = await authMiddleware(request);
        allowAdmin(user);

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        const action = searchParams.get("action");
        const entity = searchParams.get("entity");
        const search = searchParams.get("search");

        const whereCondition = {};
        if (action && action !== "ALL") whereCondition.action = action;
        if (entity && entity !== "ALL") whereCondition.entity = entity;
        if (search) {
            whereCondition[Op.or] = [
                { details: { [Op.like]: `%${search}%` } },
                { entity: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await AuditLog.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name", "email", "roleId"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit,
            offset,
        });

        return Response.json({
            success: true,
            data: {
                logs: rows,
                pagination: {
                    totalRecords: count,
                    currentPage: page,
                    totalPages: Math.ceil(count / limit) || 1,
                    limit,
                },
            },
        });
    } catch (error) {
        console.error("Audit Logs Error:", error);
        const isAuth = error.message === "Invalid or Expired Token";
        const isForbidden = error.message?.includes("Forbidden");
        return Response.json(
            { success: false, message: error.message || "Failed to load audit logs" },
            { status: isAuth ? 401 : isForbidden ? 403 : 500 }
        );
    }
}
