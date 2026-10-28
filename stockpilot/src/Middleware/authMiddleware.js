
import jwt from "jsonwebtoken";
import { User } from "@/Model/index";

const authMiddleware = async (request) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
        throw new Error("Invalid or Expired Token");
    }

    const [scheme, token, ...extra] =
        authHeader.trim().split(/\s+/);

    if (
        scheme?.toLowerCase() !== "bearer" ||
        !token ||
        extra.length > 0
    ) {
        throw new Error("Invalid or Expired Token");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT configuration missing");
    }

    let decoded;

    try {
        decoded = jwt.verify(token, secret);
    } catch {
        throw new Error("Invalid or Expired Token");
    }

    // Validate the user against the database.
    // Sequelize paranoid mode excludes soft-deleted users.
    const user = await User.findByPk(decoded.id, {
        attributes: ["id", "name", "email", "roleId"],
    });

    if (!user) {
        throw new Error("Invalid or Expired Token");
    }

    // Return the current database role, not the potentially stale JWT role.
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
    };
};

export default authMiddleware;
