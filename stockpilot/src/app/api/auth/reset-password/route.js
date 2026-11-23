export const runtime = "nodejs";

import connectDB from "@/lib/db/connectDB";
import User from "@/Model/userModel";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp } from "@/Utils/rateLimiter";
import { sendPasswordResetOtpEmail } from "@/lib/mailer";

export async function POST(request) {
    try {
        const clientIp = getClientIp(request);
        const rateLimit = checkRateLimit(`reset_pwd_${clientIp}`, 12, 15 * 60 * 1000);

        if (!rateLimit.allowed) {
            return Response.json(
                {
                    success: false,
                    message: `Too many attempts. Please wait ${rateLimit.resetInSeconds} seconds.`,
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimit.resetInSeconds),
                    },
                }
            );
        }

        await connectDB();

        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json(
                { success: false, message: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { action = "verify_and_reset", email, otp, newPassword, confirmPassword } = body || {};

        if (typeof email !== "string" || !email.trim()) {
            return Response.json(
                { success: false, message: "Registered email address is required." },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return Response.json(
                { success: false, message: "Please provide a valid email format." },
                { status: 400 }
            );
        }

        const user = await User.findOne({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return Response.json(
                {
                    success: false,
                    message: "No registered account found with this email address.",
                },
                { status: 404 }
            );
        }

        // ==========================================
        // ACTION 1: SEND OTP (Forgot Password Step 1)
        // ==========================================
        if (action === "send_otp") {
            // Generate a secure 6-digit numeric OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await user.update({
                resetOtp: generatedOtp,
                resetOtpExpires: expiresAt,
            });

            // Dispatch Brevo OTP email
            try {
                await sendPasswordResetOtpEmail({
                    to: user.email,
                    name: user.name,
                    otp: generatedOtp,
                });
            } catch (mailErr) {
                console.error("Failed to dispatch OTP email:", mailErr);
            }

            return Response.json(
                {
                    success: true,
                    message: "A 6-digit verification code (OTP) has been sent to your email.",
                },
                { status: 200 }
            );
        }

        // ==========================================
        // ACTION 2: VERIFY OTP AND UPDATE PASSWORD
        // ==========================================
        if (!otp || String(otp).trim().length !== 6) {
            return Response.json(
                { success: false, message: "Please enter the 6-digit OTP code sent to your email." },
                { status: 400 }
            );
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
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

        // Validate OTP
        if (!user.resetOtp || user.resetOtp.trim() !== String(otp).trim()) {
            return Response.json(
                { success: false, message: "Invalid verification code. Please check and try again." },
                { status: 400 }
            );
        }

        // Check expiry
        if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
            return Response.json(
                { success: false, message: "Verification code has expired. Please request a new one." },
                { status: 400 }
            );
        }

        // Hash new password and clear OTP
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({
            password: hashedPassword,
            resetOtp: null,
            resetOtpExpires: null,
        });

        return Response.json(
            {
                success: true,
                message: "Password reset successful! You can now sign in with your new password.",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Password reset error:", error);
        return Response.json(
            {
                success: false,
                message: error?.message || "Failed to process request. Please try again.",
            },
            { status: 500 }
        );
    }
}
