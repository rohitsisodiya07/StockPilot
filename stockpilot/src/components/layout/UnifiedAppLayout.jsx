"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProfileModal from "@/components/profile/ProfileModal";
import {
    LayoutDashboard,
    Package,
    Layers,
    Boxes,
    Activity,
    ShoppingBag,
    Receipt,
    Users,
    Warehouse,
    BarChart3,
    UserCheck,
    Menu,
    X,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Bell,
    Shield,
    CheckSquare,
    Clock,
    ArrowLeftRight,
    RotateCcw,
    History,
    ClipboardList,
} from "lucide-react";

const ICON_MAP = {
    dashboard: LayoutDashboard,
    package: Package,
    grid: Layers,
    boxes: Boxes,
    activity: Activity,
    shopping: ShoppingBag,
    receipt: Receipt,
    users: Users,
    warehouse: Warehouse,
    chart: BarChart3,
    user: UserCheck,
    shield: Shield,
    tasks: CheckSquare,
    shift: Clock,
    transfer: ArrowLeftRight,
    inspection: RotateCcw,
    history: History,
    clipboard: ClipboardList,
};

export default function UnifiedAppLayout({
    roleName = "Admin",
    roleTitle = "Administrator",
    roleBadgeColor = "indigo", // "indigo" | "blue" | "emerald"
    allowedRoles = [1],
    navigation = [],
    children,
}) {
    const pathname = usePathname();
    const router = useRouter();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [user, setUser] = useState({
        name: "User",
        email: "",
        role: roleTitle,
    });

    useEffect(() => {
        const savedUser = sessionStorage.getItem("stockpilot_user");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                const roleNum = Number(userData.roleId);
                const displayRole =
                    roleNum === 1
                        ? "Administrator"
                        : roleNum === 4
                        ? "Inventory Manager"
                        : "Warehouse Staff";

                setUser({
                    name: userData.name || "User",
                    email: userData.email || "",
                    role: displayRole,
                });
            } catch (err) {
                console.error("Failed to parse user details:", err);
            }
        }
    }, [roleTitle]);

    const handleLogout = () => {
        sessionStorage.removeItem("stockpilot_token");
        sessionStorage.removeItem("stockpilot_user");
        router.replace("/");
    };

    const isActive = (href) => {
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    // Role Accent Badges
    const badgeColors = {
        indigo: {
            bg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/80",
            dot: "bg-indigo-500",
            iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
            activeItem: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold",
            activeIcon: "text-indigo-600 dark:text-indigo-400",
        },
        blue: {
            bg: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/80",
            dot: "bg-blue-500",
            iconBg: "bg-blue-600 text-white shadow-blue-500/20",
            activeItem: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold",
            activeIcon: "text-blue-600 dark:text-blue-400",
        },
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80",
            dot: "bg-emerald-500",
            iconBg: "bg-emerald-600 text-white shadow-emerald-500/20",
            activeItem: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold",
            activeIcon: "text-emerald-600 dark:text-emerald-400",
        },
    };

    const currentBadge = badgeColors[roleBadgeColor] || badgeColors.indigo;

    const sidebarContent = (
        <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
            {/* Header Brand */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
                <Link
                    href={navigation[0]?.items[0]?.href || "/"}
                    className={`flex items-center gap-2.5 ${collapsed ? "justify-center w-full" : ""}`}
                >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${currentBadge.iconBg} shadow-md`}>
                        <Warehouse className="h-5 w-5" />
                    </div>

                    {!collapsed && (
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                                    Stock<span className="text-blue-600 dark:text-blue-400">Pilot</span>
                                </span>
                                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${currentBadge.bg}`}>
                                    {roleName}
                                </span>
                            </div>
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                Enterprise ERP
                            </p>
                        </div>
                    )}
                </Link>

                {mobileOpen && (
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close navigation"
                        className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation Sections */}
            <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
                {navigation.map((group) => (
                    <div key={group.title}>
                        {!collapsed && (
                            <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {group.title}
                            </p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                const IconComponent = ICON_MAP[item.icon] || Package;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                            active
                                                ? `${currentBadge.activeItem} shadow-xs border`
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        } ${collapsed ? "justify-center px-2" : ""}`}
                                        title={collapsed ? item.label : undefined}
                                    >
                                        <div className={active ? currentBadge.activeIcon : "text-slate-400 dark:text-slate-500"}>
                                            <IconComponent className="h-5 w-5 shrink-0" />
                                        </div>
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer: User Details, Theme Toggle & Logout */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                {!collapsed && (
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Appearance
                        </span>
                        <ThemeToggle />
                    </div>
                )}

                <div
                    className={`flex items-center gap-2.5 rounded-xl p-1.5 transition ${
                        collapsed ? "justify-center flex-col gap-2" : ""
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => setProfileOpen(true)}
                        title="My Profile & Change Password"
                        className={`flex items-center gap-2.5 rounded-lg p-1 text-left hover:bg-slate-200/60 dark:hover:bg-slate-800 transition min-w-0 flex-1 cursor-pointer ${
                            collapsed ? "justify-center" : ""
                        }`}
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs shadow-xs">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                        </div>

                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {user.name}
                                </p>
                                <p className="truncate text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                    {user.role} &bull; <span className="text-blue-600 dark:text-blue-400">Settings</span>
                                </p>
                            </div>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Sign Out"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition shrink-0 cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <AuthGuard allowedRoles={allowedRoles}>
            <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
                {/* Desktop Sidebar */}
                <aside
                    className={`hidden shrink-0 transition-all duration-200 lg:block ${
                        collapsed ? "w-20" : "w-64"
                    }`}
                >
                    <div className="sticky top-0 h-screen">
                        {sidebarContent}
                    </div>
                </aside>

                {/* Mobile Drawer Backdrop */}
                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                {/* Mobile Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-200 lg:hidden ${
                        mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    {sidebarContent}
                </aside>

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col min-w-0">
                    {/* Top Bar */}
                    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md transition-colors duration-200">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open navigation menu"
                                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            <button
                                type="button"
                                onClick={() => setCollapsed(!collapsed)}
                                aria-label="Collapse sidebar"
                                className="hidden rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:block"
                            >
                                {collapsed ? (
                                    <ChevronRight className="h-4 w-4" />
                                ) : (
                                    <ChevronLeft className="h-4 w-4" />
                                )}
                            </button>

                            <div className="flex items-center gap-2">
                                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${currentBadge.dot} animate-pulse`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    {roleTitle} Workspace
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Notification Bell */}
                            <NotificationBell role={roleName?.toLowerCase() || "admin"} />

                            {/* Dark Mode Switcher */}
                            <ThemeToggle />

                            {/* User Initials Pill */}
                            <button
                                type="button"
                                onClick={() => setProfileOpen(true)}
                                title="My Profile & Change Password"
                                className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-left hover:opacity-85 transition cursor-pointer"
                            >
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                                        {user.name}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                        {user.role}
                                    </p>
                                </div>
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-xs">
                                    {user.name ? user.name.slice(0, 1).toUpperCase() : "U"}
                                </div>
                            </button>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </div>

            {/* Profile & Password Reset Modal */}
            {profileOpen && (
                <ProfileModal
                    user={user}
                    onClose={() => setProfileOpen(false)}
                />
            )}
        </AuthGuard>
    );
}
