
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
    {
        title: "HOME",
        items: [
            { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
        ],
    },
    {
        title: "INVENTORY",
        items: [
            { label: "Products", href: "/admin/products", icon: "package" },
            { label: "Categories", href: "/admin/categories", icon: "grid" },
            { label: "Inventory", href: "/admin/inventory", icon: "boxes" },
            {
                label: "Stock Movements",
                href: "/admin/stock-movement",
                icon: "activity",
            },
        ],
    },
    {
        title: "OPERATIONS",
        items: [
            {
                label: "Purchase Orders",
                href: "/admin/purchase-orders",
                icon: "shopping",
            },
            {
                label: "Sales Orders",
                href: "/admin/sales-orders",
                icon: "receipt",
            },
            { label: "Suppliers", href: "/admin/suppliers", icon: "users" },
            { label: "Warehouses", href: "/admin/warehouses", icon: "warehouse" },
        ],
    },
    {
        title: "MANAGEMENT",
        items: [
            { label: "Users", href: "/admin/users", icon: "user" },
            { label: "Reports", href: "/admin/reports", icon: "chart" },
        ],
    },
];

const iconPaths = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    package: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
        </>
    ),
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    boxes: (
        <>
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </>
    ),
    activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    shopping: (
        <>
            <path d="M3 3h2l2.5 12h11l3-8H6" />
            <circle cx="10" cy="19" r="1.5" />
            <circle cx="18" cy="19" r="1.5" />
        </>
    ),
    receipt: (
        <>
            <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
            <path d="M8 8h8M8 12h8M8 16h4" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    warehouse: (
        <>
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
            <path d="M9 21v-7h6v7M3 10h18" />
        </>
    ),
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
    ),
    chart: (
        <>
            <path d="M3 3v18h18" />
            <path d="m8 15 4-4 4 3 5-7" />
        </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    logout: (
        <>
            <path d="M12 2v10" />
            <path d="M6.2 5.8a8 8 0 1 0 11.6 0" />
        </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </>
    ),
};

function Icon({ name, size = 21, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {iconPaths[name] || iconPaths.package}
        </svg>
    );
}

function Brand({ collapsed }) {
    return (
        <Link
            href="/admin/dashboard"
            aria-label="StockPilot dashboard"
            className={`flex min-w-0 items-center gap-3 ${collapsed ? "justify-center" : ""
                }`}
        >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-700">
                <Icon name="warehouse" size={27} />
            </div>

            {!collapsed && (
                <div className="min-w-0">
                    <p className="text-[23px] font-bold tracking-tight text-slate-900">
                        StockPilot
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-slate-500">
                        INVENTORY MANAGEMENT
                    </p>
                </div>
            )}
        </Link>
    );
}

function readUserFromToken(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(
            decodeURIComponent(
                atob(base64)
                    .split("")
                    .map(
                        (char) =>
                            `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
                    )
                    .join("")
            )
        );

        const roleId = Number(decoded.roleId);
        const roles = {
            1: "Administrator",
            4: "Inventory Manager",
            5: "Warehouse Staff",
        };

        return {
            name:
                decoded.name ||
                decoded.fullName ||
                decoded.username ||
                decoded.email?.split("@")[0] ||
                "User",
            role: roles[roleId] || "User",
        };
    } catch {
        return { name: "User", role: "Account" };
    }
}

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState({ name: "User", role: "Account" });

    useEffect(() => {
        const savedUser = sessionStorage.getItem("stockpilot_user");

        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);

                setUser({
                    name: userData.name || "User",
                    role:
                        Number(userData.roleId) === 1
                            ? "Administrator"
                            : Number(userData.roleId) === 4
                                ? "Inventory Manager"
                                : Number(userData.roleId) === 5
                                    ? "Warehouse Staff"
                                    : "User",
                });
            } catch (error) {
                console.error("Unable to read user details:", error);
            }
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("stockpilot_token");
        sessionStorage.removeItem("stockpilot_user");
        router.replace("/");
    };

    const isActive = (href) => {
        if (href === "/admin/dashboard") return pathname === href;

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const sidebarContent = (
        <div className="flex h-full min-h-0 flex-col bg-white">
            {/* Brand */}
            <div className="flex h-[96px] shrink-0 items-center border-b border-slate-100 px-6">
                <Brand collapsed={collapsed} />

                {mobileOpen && (
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                        className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    >
                        <Icon name="close" />
                    </button>
                )}
            </div>

            {/* Scrollable navigation */}
            <nav className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 py-8">
                {navigation.map((group) => (
                    <section key={group.title}>
                        {!collapsed && (
                            <p className="mb-4 px-3 text-xs font-semibold tracking-[0.1em] text-slate-500">
                                {group.title}
                            </p>
                        )}

                        <div className="space-y-2">
                            {group.items.map((item) => {
                                const active = isActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={collapsed ? item.label : undefined}
                                        onClick={() => setMobileOpen(false)}
                                        className={`group relative flex min-h-[52px] items-center gap-4 rounded-xl px-4 text-[15px] transition-colors ${collapsed ? "justify-center" : ""
                                            } ${active
                                                ? "bg-blue-50 font-semibold text-blue-700"
                                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                                            }`}
                                    >
                                        {active && (
                                            <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-blue-600" />
                                        )}

                                        <Icon
                                            name={item.icon}
                                            size={22}
                                            className={`shrink-0 ${active ? "text-blue-700" : "text-slate-500"
                                                }`}
                                        />

                                        {!collapsed && (
                                            <>
                                                <span className="min-w-0 flex-1">{item.label}</span>
                                                {active && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                )}
                                            </>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </nav>

            {/* User profile + power/logout icon */}
            <div className="shrink-0 border-t border-slate-100 bg-white p-4">
                <div
                    className={`flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 p-3 ${collapsed ? "justify-center" : ""
                        }`}
                >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white bg-white text-lg font-bold text-blue-700 shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>

                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[16px] font-semibold text-slate-900">
                                {user.name}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-500">
                                {user.role}
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-blue-500 transition hover:bg-white hover:text-rose-600"
                    >
                        <Icon name="logout" size={25} />
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setCollapsed(!collapsed)}
                    className="mt-3 hidden min-h-9 w-full items-center justify-center rounded-lg text-xs text-slate-500 hover:bg-slate-50 lg:flex"
                >
                    {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9fb] text-slate-800">
            {/* Desktop sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-200 lg:block ${collapsed ? "w-[84px]" : "w-[300px]"
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar backdrop"
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
                />
            )}

            {/* Mobile sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-[300px] max-w-[88vw] border-r border-slate-200 bg-white transition-transform duration-200 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {sidebarContent}
            </aside>

            {/* Main workspace */}
            <div
                className={`min-h-screen transition-[margin] duration-200 ${collapsed ? "lg:ml-[84px]" : "lg:ml-[300px]"
                    }`}
            >
                {/* Top navbar */}
                <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open sidebar"
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                        >
                            <Icon name="menu" size={23} />
                        </button>

                        <div>
                            <p className="text-[15px] font-semibold text-slate-900">
                                Admin Workspace
                            </p>
                            <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                                Manage your inventory operations
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-5">
                        <span className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 md:flex">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Workspace
                        </span>

                        <button
                            type="button"
                            aria-label="Notifications"
                            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        >
                            <Icon name="bell" size={22} />
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-500 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                            <Icon name="logout" size={22} />
                        </button>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
