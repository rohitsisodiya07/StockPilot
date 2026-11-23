"use client";

import UnifiedAppLayout from "./UnifiedAppLayout";

const adminNavigation = [
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
            { label: "Stock Movements", href: "/admin/stock-movement", icon: "activity" },
        ],
    },
    {
        title: "OPERATIONS",
        items: [
            { label: "Purchase Orders", href: "/admin/purchase-orders", icon: "shopping" },
            { label: "Sales Orders", href: "/admin/sales-orders", icon: "receipt" },
            { label: "Suppliers", href: "/admin/suppliers", icon: "users" },
            { label: "Warehouses", href: "/admin/warehouses", icon: "warehouse" },
        ],
    },
    {
        title: "MANAGEMENT",
        items: [
            { label: "Users", href: "/admin/users", icon: "user" },
            { label: "Reports", href: "/admin/reports", icon: "chart" },
            { label: "Audit Logs", href: "/admin/audit-logs", icon: "shield" },
        ],
    },
];

export default function AdminLayout({ children }) {
    return (
        <UnifiedAppLayout
            roleName="Admin"
            roleTitle="Administrator"
            roleBadgeColor="indigo"
            allowedRoles={[1]}
            navigation={adminNavigation}
        >
            {children}
        </UnifiedAppLayout>
    );
}
