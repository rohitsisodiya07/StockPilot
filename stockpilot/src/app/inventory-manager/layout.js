"use client";

import UnifiedAppLayout from "@/components/layout/UnifiedAppLayout";

const managerNavigation = [
    {
        title: "HOME",
        items: [
            {
                label: "Dashboard",
                href: "/inventory-manager/dashboard",
                icon: "dashboard",
            },
        ],
    },
    {
        title: "INVENTORY",
        items: [
            {
                label: "Products",
                href: "/inventory-manager/products",
                icon: "package",
            },
            {
                label: "Inventory",
                href: "/inventory-manager/inventory",
                icon: "boxes",
            },
            {
                label: "Stock Movements",
                href: "/inventory-manager/stock-movement",
                icon: "activity",
            },
            {
                label: "Warehouses",
                href: "/inventory-manager/warehouses",
                icon: "warehouse",
            },
        ],
    },
    {
        title: "OPERATIONS",
        items: [
            {
                label: "Purchase Orders",
                href: "/inventory-manager/purchase-orders",
                icon: "shopping",
            },
            {
                label: "Sales Orders",
                href: "/inventory-manager/sales-orders",
                icon: "receipt",
            },
            {
                label: "Suppliers",
                href: "/inventory-manager/suppliers",
                icon: "users",
            },
        ],
    },
    {
        title: "ANALYTICS",
        items: [
            {
                label: "Reports",
                href: "/inventory-manager/reports",
                icon: "chart",
            },
        ],
    },
];

export default function InventoryManagerLayout({ children }) {
    return (
        <UnifiedAppLayout
            roleName="Manager"
            roleTitle="Inventory Manager"
            roleBadgeColor="blue"
            allowedRoles={[4, 1]}
            navigation={managerNavigation}
        >
            {children}
        </UnifiedAppLayout>
    );
}
