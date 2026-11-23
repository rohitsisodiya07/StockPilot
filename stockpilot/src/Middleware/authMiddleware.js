
import jwt from "jsonwebtoken";
import { User } from "@/Model/index";

// In-memory cache for verified users to avoid hitting DB on every single API request
const userAuthCache = new Map();
const USER_CACHE_TTL = 30000; // 30 seconds

export const invalidateUserAuthCache = (userId) => {
    if (userId) {
        userAuthCache.delete(Number(userId));
    } else {
        userAuthCache.clear();
    }
};

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

    // Check in-memory cache first for fast response
    const cached = userAuthCache.get(decoded.id);
    if (cached && Date.now() < cached.expiresAt) {
        if (cached.user.status && cached.user.status !== "ACTIVE") {
            userAuthCache.delete(decoded.id);
            const err = new Error("Account is inactive, suspended, or pending approval");
            err.status = 403;
            err.statusCode = 403;
            throw err;
        }
        return cached.user;
    }

    // Validate the user against the database.
    // Sequelize paranoid mode excludes soft-deleted users.
    const user = await User.findByPk(decoded.id, {
        attributes: ["id", "name", "email", "roleId", "status"],
    });

    if (!user) {
        throw new Error("Invalid or Expired Token");
    }

    if (user.status !== "ACTIVE") {
        userAuthCache.delete(decoded.id);
        const err = new Error("Account is inactive, suspended, or pending approval");
        err.status = 403;
        err.statusCode = 403;
        throw err;
    }

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
    };

    userAuthCache.set(decoded.id, {
        user: userData,
        expiresAt: Date.now() + USER_CACHE_TTL,
    });

    return userData;
};

export default authMiddleware;
