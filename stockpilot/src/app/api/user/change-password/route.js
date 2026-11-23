export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import authMiddleware from "@/Middleware/authMiddleware";
import User from "@/Model/userModel";
import bcrypt from "bcrypt";

export async function POST(request) {
    try {
        await connectDB();

        // 1. Authenticate user
        const authUser = await authMiddleware(request);

        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json(
                { success: false, message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword, confirmPassword } = body || {};

        if (!currentPassword || typeof currentPassword !== "string") {
            return Response.json(
                { success: false, message: "Current password is required." },
                { status: 400 }
            );
        }

        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
            return Response.json(
                { success: false, message: "New password must be at least 6 characters long." },
                { status: 400 }
            );
        }

        if (confirmPassword !== undefined && newPassword !== confirmPassword) {
            return Response.json(
                { success: false, message: "New password and confirmation password do not match." },
                { status: 400 }
            );
        }

        if (currentPassword === newPassword) {
            return Response.json(
                { success: false, message: "New password cannot be the same as your current password." },
                { status: 400 }
            );
        }

        // Fetch user record with password
        const user = await User.findByPk(authUser.id);
        if (!user) {
            return Response.json(
                { success: false, message: "User account not found." },
                { status: 404 }
            );
        }

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return Response.json(
                { success: false, message: "Current password is incorrect. Please try again." },
                { status: 400 }
            );
        }

        // 3. Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return Response.json(
            {
                success: true,
                message: "Password changed successfully! Please use your new password next time you sign in.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Change Password API Error:", error);

        const isAuthError =
            error?.message === "Invalid or Expired Token" ||
            error?.message?.includes("inactive");

        return Response.json(
            {
                success: false,
                message: isAuthError ? error.message : "Failed to change password. Please try again.",
            },
            { status: isAuthError ? 401 : 500 }
        );
    }
}
