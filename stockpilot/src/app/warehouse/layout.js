"use client";

import UnifiedAppLayout from "@/components/layout/UnifiedAppLayout";

const warehouseNavigation = [
    {
        title: "OVERVIEW",
        items: [
            {
                label: "Floor Dashboard",
                href: "/warehouse/dashboard",
                icon: "dashboard",
            },
            {
                label: "Shift & Attendance",
                href: "/warehouse/shifts",
                icon: "shift",
            },
        ],
    },
    {
        title: "STAFF WORKFLOW",
        items: [
            {
                label: "My Tasks & History",
                href: "/warehouse/tasks",
                icon: "tasks",
            },
            {
                label: "My Activity Trail",
                href: "/warehouse/activity",
                icon: "history",
            },
        ],
    },
    {
        title: "STOCK OPERATIONS",
        items: [
            {
                label: "Inventory Browser",
                href: "/warehouse/inventory",
                icon: "boxes",
            },
            {
                label: "Transfer Requests",
                href: "/warehouse/transfers",
                icon: "transfer",
            },
            {
                label: "Return Inspection",
                href: "/warehouse/returns",
                icon: "inspection",
            },
            {
                label: "Stock Movements Log",
                href: "/warehouse/stock-movement",
                icon: "activity",
            },
        ],
    },
    {
        title: "SHIPMENTS & ORDERS",
        items: [
            {
                label: "Inbound (Purchase Orders)",
                href: "/warehouse/purchase-orders",
                icon: "shopping",
            },
            {
                label: "Outbound (Sales Orders)",
                href: "/warehouse/sales-orders",
                icon: "receipt",
            },
        ],
    },
];

export default function WarehouseLayout({ children }) {
    return (
        <UnifiedAppLayout
            roleName="Staff"
            roleTitle="Warehouse Staff"
            roleBadgeColor="emerald"
            allowedRoles={[5, 4, 1]}
            navigation={warehouseNavigation}
        >
            {children}
        </UnifiedAppLayout>
    );
}
