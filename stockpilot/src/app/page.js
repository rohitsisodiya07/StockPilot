"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
    Warehouse,
    ShieldCheck,
    Eye,
    EyeOff,
    ArrowRight,
    Boxes,
    Package,
    Activity,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    LogIn,
    Sparkles,
    KeyRound,
    ArrowLeft,
    Shield,
    Lock,
    Zap,
    Users,
} from "lucide-react";

const ROLE_ROUTES = {
    1: "/admin/dashboard",
    4: "/inventory-manager/dashboard",
    5: "/warehouse/dashboard",
};

export default function AuthenticationPage() {
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("login"); // "login" | "signup" | "forgot"

    // Login Form State
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Signup Form State
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [signupRole, setSignupRole] = useState(5); // 4 = Manager, 5 = Staff

    // Forgot Password Form State
    const [forgotStep, setForgotStep] = useState("email"); // "email" | "otp"
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotOtp, setForgotOtp] = useState("");
    const [forgotNewPassword, setForgotNewPassword] = useState("");
    const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
    const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
    const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Quick Demo autofill helper
    const fillDemoAccount = (email, password) => {
        setLoginEmail(email);
        setLoginPassword(password);
        setError("");
        setSuccessMessage("");
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (isLoading) return;
        setIsLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: loginEmail.trim().toLowerCase(),
                password: loginPassword,
            });

            const result = response.data?.data;
            const token = result?.token;
            const user = result?.user;

            if (!response.data?.success || !token || !user) {
                setError("Unable to sign in. Please verify your credentials.");
                return;
            }

            const dashboard = ROLE_ROUTES[Number(user.roleId)];
            if (!dashboard) {
                setError("Your account does not have an assigned role dashboard.");
                return;
            }

            sessionStorage.setItem("stockpilot_token", token);
            sessionStorage.setItem("stockpilot_user", JSON.stringify(user));

            router.replace(dashboard);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                setError("Invalid email or password. Please try again.");
            } else if (status === 403) {
                setError(err.response?.data?.message || "Account access restricted. Please contact the administrator.");
            } else {
                console.error("Login failed:", err);
                setError(err.response?.data?.message || "Unable to connect. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!forgotEmail || !forgotEmail.trim()) {
            setError("Please enter your registered email address.");
            return;
        }

        setIsSendingOtp(true);

        try {
            const response = await api.post("/auth/reset-password", {
                action: "send_otp",
                email: forgotEmail.trim().toLowerCase(),
            });

            if (response.data?.success) {
                setForgotStep("otp");
                setSuccessMessage(response.data.message || "A 6-digit verification code (OTP) has been sent to your email.");
            } else {
                setError(response.data?.message || "Failed to send OTP.");
            }
        } catch (err) {
            console.error("Send OTP error:", err);
            setError(err.response?.data?.message || "Failed to send OTP. Please check your email.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyAndResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!forgotOtp || forgotOtp.trim().length !== 6) {
            setError("Please enter the 6-digit verification code sent to your email.");
            return;
        }

        if (forgotNewPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }

        if (forgotNewPassword !== forgotConfirmPassword) {
            setError("New password and confirmation password do not match.");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const response = await api.post("/auth/reset-password", {
                action: "verify_and_reset",
                email: forgotEmail.trim().toLowerCase(),
                otp: forgotOtp.trim(),
                newPassword: forgotNewPassword,
                confirmPassword: forgotConfirmPassword,
            });

            if (response.data?.success) {
                setSuccessMessage(response.data?.message || "Password reset successful! Please sign in with your new password.");
                setLoginEmail(forgotEmail.trim().toLowerCase());
                setLoginPassword("");
                setActiveTab("login");
                setForgotStep("email");
                setForgotOtp("");
                setForgotNewPassword("");
                setForgotConfirmPassword("");
            } else {
                setError(response.data?.message || "Password reset failed.");
            }
        } catch (err) {
            console.error("Password reset error:", err);
            setError(err.response?.data?.message || "Invalid or expired OTP code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (signupPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const response = await api.post("/auth/register", {
                name: signupName.trim(),
                email: signupEmail.trim().toLowerCase(),
                password: signupPassword,
                roleId: Number(signupRole),
            });

            const result = response.data?.data;
            const token = result?.token;
            const user = result?.user;

            if (response.data?.pendingApproval) {
                setSuccessMessage(response.data.message || "Registration request submitted! Your account is pending Admin approval and warehouse assignment. You will receive an email once approved.");
                setActiveTab("login");
                setLoginEmail(signupEmail.trim().toLowerCase());
                setSignupPassword("");
            } else if (token && user) {
                sessionStorage.setItem("stockpilot_token", token);
                sessionStorage.setItem("stockpilot_user", JSON.stringify(user));

                setSuccessMessage("Account created! Redirecting to your workspace...");
                const dashboard = ROLE_ROUTES[Number(user.roleId)] || "/warehouse/dashboard";

                setTimeout(() => {
                    router.replace(dashboard);
                }, 900);
            } else {
                setSuccessMessage("Account created successfully. Please sign in.");
                setActiveTab("login");
                setLoginEmail(signupEmail);
            }
        } catch (err) {
            console.error("Registration failed:", err);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between px-4 sm:px-8 lg:px-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                        <Warehouse className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            Stock<span className="text-blue-600 dark:text-blue-400">Pilot</span>
                        </span>
                        <span className="hidden sm:inline-block ml-2 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                            ERP v2.0
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        System Active
                    </span>
                    <ThemeToggle showLabel={false} />
                </div>
            </header>

            {/* Main Auth Container */}
            <div className="flex-1 flex items-center justify-center p-3.5 sm:p-6 lg:p-10">
                <div className="w-full max-w-4xl lg:max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-black/70 overflow-hidden">
                    {/* Left Hero Brand Panel (Desktop) */}
                    <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 xl:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-blue-200 mb-6 backdrop-blur-xs font-semibold">
                                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                                <span>Multi-Warehouse ERP</span>
                            </div>

                            <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight">
                                Complete clarity for your stock.
                                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                                    Confidence in every shipment.
                                </span>
                            </h1>

                            <p className="mt-4 text-xs xl:text-sm text-slate-300 leading-relaxed">
                                Streamline floor operations across all facilities with role-based access for Administrators, Inventory Managers, and Ground Staff.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-3 my-6">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Role-Based Workspaces",
                                    desc: "Custom tailored dashboards for Admin, Manager & Floor Staff",
                                },
                                {
                                    icon: Activity,
                                    title: "Real-time Concurrency Locks",
                                    desc: "Row-level locks prevent race conditions on inventory",
                                },
                                {
                                    icon: Boxes,
                                    title: "Depletion & 1-Click Reorder",
                                    desc: "Automated thresholds & instant draft purchase orders",
                                },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs hover:bg-white/10 transition"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 text-[11px] text-slate-400 border-t border-white/10 pt-4 flex items-center justify-between">
                            <span>© {new Date().getFullYear()} StockPilot ERP</span>
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                Enterprise Secure
                            </span>
                        </div>
                    </div>

                    {/* Right Form Card (Login / Signup / Forgot) */}
                    <div className="relative lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
                        {/* Loading Top Bar */}
                        {isLoading && (
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-100 dark:bg-blue-950/80 overflow-hidden z-20">
                                <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 animate-pulse w-full" />
                            </div>
                        )}

                        <div className="max-w-md w-full mx-auto space-y-5">
                            {/* Mobile Brand Banner (Visible only on mobile/tablet) */}
                            <div className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-lg border border-white/10 relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] text-blue-200 mb-2 font-semibold">
                                        <Sparkles className="h-3 w-3 text-blue-400" />
                                        <span>StockPilot ERP</span>
                                    </div>
                                    <h2 className="text-base font-extrabold tracking-tight">
                                        Multi-Warehouse Inventory
                                    </h2>
                                    <p className="text-[11px] text-slate-300 mt-0.5">
                                        Real-time stock movements & role-based controls.
                                    </p>

                                    <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-white/10 text-center">
                                        <div className="rounded-lg bg-white/5 p-1.5 border border-white/10">
                                            <Shield className="h-3.5 w-3.5 mx-auto text-blue-300 mb-0.5" />
                                            <span className="text-[9px] font-bold block text-slate-200">Role Security</span>
                                        </div>
                                        <div className="rounded-lg bg-white/5 p-1.5 border border-white/10">
                                            <Activity className="h-3.5 w-3.5 mx-auto text-emerald-300 mb-0.5" />
                                            <span className="text-[9px] font-bold block text-slate-200">Live Shifts</span>
                                        </div>
                                        <div className="rounded-lg bg-white/5 p-1.5 border border-white/10">
                                            <Boxes className="h-3.5 w-3.5 mx-auto text-amber-300 mb-0.5" />
                                            <span className="text-[9px] font-bold block text-slate-200">Auto Reorder</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab Switcher / Back Button */}
                            {activeTab === "forgot" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveTab("login");
                                        setError("");
                                        setSuccessMessage("");
                                    }}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back to Sign In</span>
                                </button>
                            ) : (
                                <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab("login");
                                            setError("");
                                            setSuccessMessage("");
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition duration-150 ${
                                            activeTab === "login"
                                                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <LogIn className="h-3.5 w-3.5" />
                                        <span>Sign In</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab("signup");
                                            setError("");
                                            setSuccessMessage("");
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition duration-150 ${
                                            activeTab === "signup"
                                                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                        }`}
                                    >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Create Account</span>
                                    </button>
                                </div>
                            )}

                            {/* Section Titles */}
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                    {activeTab === "login"
                                        ? "Welcome back"
                                        : activeTab === "signup"
                                        ? "Create your account"
                                        : "Reset your password"}
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {activeTab === "login"
                                        ? "Enter your credentials to access your designated workspace."
                                        : activeTab === "signup"
                                        ? "Join as an Inventory Manager or Warehouse Staff to start managing stock."
                                        : "Enter your registered email address to set a new password."}
                                </p>
                            </div>

                            {/* Error & Success Alerts */}
                            {error && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-xs text-red-700 dark:text-red-300">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* FORMS */}
                            {activeTab === "login" ? (
                                /* SIGN IN FORM */
                                <form onSubmit={handleLoginSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="you@company.com"
                                            value={loginEmail}
                                            onChange={(e) => {
                                                setLoginEmail(e.target.value);
                                                setError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab("forgot");
                                                    setError("");
                                                    setSuccessMessage("");
                                                    setForgotEmail(loginEmail);
                                                }}
                                                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showLoginPassword ? "text" : "password"}
                                                required
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => {
                                                    setLoginPassword(e.target.value);
                                                    setError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 pr-11 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                title={showLoginPassword ? "Hide password" : "Show password"}
                                            >
                                                {showLoginPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Signing In...
                                            </span>
                                        ) : (
                                            <>
                                                <span>Sign In to Workspace</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* 1-Click Quick Demo Login Shortcuts */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                                <Zap className="h-3 w-3 text-amber-500" />
                                                Quick Demo Login
                                            </span>
                                            <span className="text-[10px] text-slate-400">1-Click fill</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fillDemoAccount("admin@stockpilot.com", "admin123")}
                                                className="py-2 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                            >
                                                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Admin</span>
                                                <span className="block text-[9px] text-slate-400">Full Access</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => fillDemoAccount("manager@stockpilot.com", "manager123")}
                                                className="py-2 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                            >
                                                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Manager</span>
                                                <span className="block text-[9px] text-slate-400">Stock & PO</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => fillDemoAccount("staff@stockpilot.com", "staff123")}
                                                className="py-2 px-2 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                            >
                                                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Staff</span>
                                                <span className="block text-[9px] text-slate-400">Floor Duties</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : activeTab === "forgot" ? (
                                /* FORGOT PASSWORD FORM (2-STEP OTP VERIFICATION) */
                                forgotStep === "email" ? (
                                    <form onSubmit={handleSendOtp} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Registered Email Address
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                inputMode="email"
                                                placeholder="you@company.com"
                                                value={forgotEmail}
                                                onChange={(e) => {
                                                    setForgotEmail(e.target.value);
                                                    setError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                We will send a 6-digit verification code (OTP) to this email address.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSendingOtp}
                                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
                                        >
                                            {isSendingOtp ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Sending OTP Code...
                                                </span>
                                            ) : (
                                                <>
                                                    <KeyRound className="h-4 w-4" />
                                                    <span>Send OTP Code &rarr;</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                                        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
                                            <div className="truncate min-w-0 pr-2">
                                                <span className="block text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Code Sent To</span>
                                                <span className="font-semibold truncate block">{forgotEmail}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setForgotStep("email");
                                                    setError("");
                                                }}
                                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline hover:no-underline shrink-0 cursor-pointer"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {/* 6-Digit OTP */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Enter 6-Digit OTP Code
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={6}
                                                inputMode="numeric"
                                                pattern="[0-9]{6}"
                                                placeholder="e.g. 123456"
                                                value={forgotOtp}
                                                onChange={(e) => {
                                                    setForgotOtp(e.target.value.replace(/\D/g, ""));
                                                    setError("");
                                                }}
                                                className="w-full text-center tracking-[8px] font-mono font-bold text-base rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                            />
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                New Password (min 6 characters)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showForgotNewPassword ? "text" : "password"}
                                                    required
                                                    minLength={6}
                                                    placeholder="Enter new password"
                                                    value={forgotNewPassword}
                                                    onChange={(e) => {
                                                        setForgotNewPassword(e.target.value);
                                                        setError("");
                                                    }}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 pr-11 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                >
                                                    {showForgotNewPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Confirm New Password */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showForgotConfirmPassword ? "text" : "password"}
                                                    required
                                                    minLength={6}
                                                    placeholder="Re-enter new password"
                                                    value={forgotConfirmPassword}
                                                    onChange={(e) => {
                                                        setForgotConfirmPassword(e.target.value);
                                                        setError("");
                                                    }}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 pr-11 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                                >
                                                    {showForgotConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Verifying OTP & Updating...
                                                </span>
                                            ) : (
                                                <>
                                                    <KeyRound className="h-4 w-4" />
                                                    <span>Verify OTP & Update Password</span>
                                                </>
                                            )}
                                        </button>

                                        <div className="text-center pt-1">
                                            <button
                                                type="button"
                                                disabled={isSendingOtp}
                                                onClick={handleSendOtp}
                                                className="text-xs font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition cursor-pointer"
                                            >
                                                {isSendingOtp ? "Resending Code..." : "Didn't receive code? Resend OTP"}
                                            </button>
                                        </div>
                                    </form>
                                )
                            ) : (
                                /* SIGN UP FORM */
                                <form onSubmit={handleSignupSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            autoComplete="name"
                                            placeholder="Your full name"
                                            value={signupName}
                                            onChange={(e) => {
                                                setSignupName(e.target.value);
                                                setError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            inputMode="email"
                                            autoComplete="email"
                                            placeholder="you@company.com"
                                            value={signupEmail}
                                            onChange={(e) => {
                                                setSignupEmail(e.target.value);
                                                setError("");
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Password (min 6 characters)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSignupPassword ? "text" : "password"}
                                                required
                                                minLength={6}
                                                autoComplete="new-password"
                                                placeholder="••••••••"
                                                value={signupPassword}
                                                onChange={(e) => {
                                                    setSignupPassword(e.target.value);
                                                    setError("");
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3.5 py-3 pr-11 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                            >
                                                {showSignupPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Select Operating Role
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setSignupRole(5)}
                                                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                                    signupRole === 5
                                                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20"
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold">Warehouse Staff</span>
                                                    <span className={`h-2.5 w-2.5 rounded-full ${signupRole === 5 ? "bg-emerald-500" : "border border-slate-400"}`} />
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                    Floor duties, transfers, tasks & shifts
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSignupRole(4)}
                                                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                                                    signupRole === 4
                                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20"
                                                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold">Inventory Manager</span>
                                                    <span className={`h-2.5 w-2.5 rounded-full ${signupRole === 4 ? "bg-blue-500" : "border border-slate-400"}`} />
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                    Orders, inventory, reports & team management
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3.5 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Creating Account...
                                            </span>
                                        ) : (
                                            <>
                                                <span>Register & Access Workspace</span>
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Footer */}
            <footer className="text-center py-4 px-4 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
                <span>StockPilot Enterprise Inventory Management System</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    256-Bit SSL Encrypted
                </span>
            </footer>
        </main>
    );
}
