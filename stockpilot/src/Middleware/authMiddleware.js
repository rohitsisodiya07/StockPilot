import jwt from "jsonwebtoken";

const authMiddleware = async (request) => {
    try {
        const authHeader = request.headers.get("authorization");

        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            throw new Error("Authorization Header Required");
        }

        const token = authHeader.split(" ")[1];

        console.log("TOKEN:", token);

        if (!token) {
            throw new Error("Token Required");
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("DECODED:", decoded);

        return decoded;

    } catch (error) {
        console.log("JWT ERROR:", error.message);
        throw new Error("Invalid or Expired Token");
    }
};

export default authMiddleware;