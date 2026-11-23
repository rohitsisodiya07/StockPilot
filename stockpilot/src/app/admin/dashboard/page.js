
"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const StockCharts = dynamic(
    () => import("@/components/dashboard/StockCharts"),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="h-[430px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col items-center justify-center shadow-xs">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Movement Chart...</span>
                </div>
                <div className="h-[430px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col items-center justify-center shadow-xs">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Trend Chart...</span>
                </div>
            </div>
        ),
    }
);

const LIMIT = 10;

const number = (value) =>
    Number(value || 0).toLocaleString("en-IN");

const dateLabel = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const dateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

function Card({ children, className = "" }) {
    return (
        <section
            className={`min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
        >
            {children}
        </section>
    );
}

function SectionHeading({ title, subtitle }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {title}
            </h2>

            {subtitle && (
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function EmptyState({ children = "No data available." }) {
    return (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-xs text-slate-500">
            {children}
        </div>
    );
}

function DashboardContent() {
    const [dashboard, setDashboard] = useState(null);
    const [warehouseId, setWarehouseId] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reorderingId, setReorderingId] = useState(null);
    const [reorderSuccessMsg, setReorderSuccessMsg] = useState("");

    const triggerAutoReorder = async (item) => {
        try {
            setReorderingId(item.id);
            setReorderSuccessMsg("");
            const res = await api.post("/inventory/auto-reorder", {
                productId: item.productId,
                warehouseId: item.warehouseId,
                quantity: item.suggestedReorderQuantity,
            });

            if (res.data?.success) {
                setReorderSuccessMsg(res.data.message);
                loadDashboard({ forceRefresh: true });
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to trigger auto reorder");
        } finally {
            setReorderingId(null);
        }
    };

    const loadDashboard = useCallback(async ({
        selectedWarehouse = warehouseId,
        selectedPage = page,
        forceRefresh = false,
    } = {}) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page: selectedPage,
                limit: LIMIT,
            };

            if (selectedWarehouse) {
                params.warehouseId = selectedWarehouse;
            }

            if (forceRefresh) {
                params.refresh = "true";
            }

            const response = await api.get("/dashboard", { params });

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Could not load dashboard."
                );
            }

            setDashboard(response.data.data || {});
        } catch (err) {
            console.error("Dashboard API error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Could not load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }, [warehouseId, page]);

    useEffect(() => {
        loadDashboard({
            selectedWarehouse: warehouseId,
            selectedPage: page,
        });
    }, [warehouseId, page, loadDashboard]);

    const changeWarehouse = (value) => {
        setWarehouseId(value);
        setPage(1);
    };

    const summary = dashboard?.summary || dashboard || {};
    const options = dashboard?.options || {};
    const analytics = dashboard?.stockAnalytics || {};
    const orders = dashboard?.orders || {};
    const alerts = dashboard?.alerts || {};
    const activity = dashboard?.activity || {};

    const warehouses = options.warehouses || [];
    const warehouseStock = analytics.warehouseStock || [];
    const chartData = analytics.chartData || [];

    const movements =
        activity.recentStockMovements ||
        dashboard?.recentStockMovements ||
        [];

    const purchase = orders.purchaseOrders || {};
    const sales = orders.salesOrders || {};

    const selectedWarehouse = warehouses.find(
        (item) => String(item.id) === String(warehouseId)
    );

    const warehouseUsers = options.warehouseUsers || {};
    const managers = warehouseUsers.managers || [];
    const staff = warehouseUsers.staff || [];

    const pagination = activity.pagination || dashboard?.pagination || {};

    const totalRecords = Number(
        pagination.totalRecords ?? pagination.total ?? movements.length
    );

    const totalPages = Math.max(
        1,
        Number(
            pagination.totalPages ||
            Math.ceil(totalRecords / LIMIT)
        )
    );

    const currentPage = Number(pagination.page || page);

    const stockTotals = chartData.reduce(
        (result, row) => ({
            stockIn: result.stockIn + Number(row.stockIn || 0),
            stockOut: result.stockOut + Number(row.stockOut || 0),
        }),
        { stockIn: 0, stockOut: 0 }
    );

    const exportCsv = () => {
        const rows = [
            ["StockPilot Warehouse Report"],
            ["Warehouse", selectedWarehouse?.name || "All accessible warehouses"],
            [],
            ["Summary", "Value"],
            ["Products", summary.totalProducts ?? 0],
            ["Warehouses", summary.totalWarehouses ?? 0],
            ["Inventory Units", summary.totalInventoryUnits ?? 0],
            ["Low Stock Items", summary.lowStockCount ?? 0],
            [],
            ["Warehouse Stock"],
            ["Warehouse", "Location", "Records", "Unique Products", "Units"],
            ...warehouseStock.map((item) => [
                item.warehouseName || "",
                item.location || "",
                item.inventoryRecords ?? 0,
                item.uniqueProducts ?? 0,
                item.totalUnits ?? 0,
            ]),
            [],
            ["Stock Movement History"],
            ["ID", "Type", "Quantity", "Product", "Staff", "Note", "Date"],
            ...movements.map((item) => [
                item.id,
                item.type,
                item.quantity,
                item.inventory?.product?.name || "",
                item.user?.name || `User #${item.userId}`,
                item.note || "",
                item.createdAt || "",
            ]),
        ];

        const csv = rows
            .map((row) =>
                row.map((value) =>
                    `"${String(value ?? "").replace(/"/g, '""')}"`
                ).join(",")
            )
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `stockpilot-${warehouseId || "all-warehouses"}-report.csv`;
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">

            {/* Dashboard Header */}
            <Card className="relative overflow-hidden border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white p-5 sm:p-6">
                <div className="relative z-10">
                    <p className="text-xs font-medium text-slate-500">
                        Home / Dashboard
                    </p>

                    <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                Warehouse Dashboard
                            </h1>

                            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-600 sm:text-sm">
                                View inventory levels, warehouse users, stock movement,
                                and order activity for a selected warehouse.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={exportCsv}
                            disabled={!dashboard || loading}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            ↓ Export CSV
                        </button>
                    </div>
                </div>

                <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/70" />
            </Card>

            {/* Warehouse Selector */}
            <Card className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <label className="block">
                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                            Select Warehouse
                        </span>

                        <select
                            value={warehouseId}
                            onChange={(event) =>
                                changeWarehouse(event.target.value)
                            }
                            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        >
                            <option value="">
                                All accessible warehouses
                            </option>

                            {warehouses.map((warehouse) => (
                                <option
                                    key={warehouse.id}
                                    value={warehouse.id}
                                >
                                    {warehouse.name}
                                    {warehouse.location
                                        ? ` — ${warehouse.location}`
                                        : ""}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboard({
                                selectedWarehouse: warehouseId,
                                selectedPage: page,
                                forceRefresh: true,
                            })
                        }
                        disabled={loading}
                        className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                    >
                        <span className={`text-sm ${loading ? "animate-spin inline-block" : ""}`}>↻</span>
                        <span>{loading ? "Refreshing..." : "Refresh"}</span>
                    </button>
                </div>

                {selectedWarehouse && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 p-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg text-blue-700">
                            ⌂
                        </span>

                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {selectedWarehouse.name}
                            </p>

                            <p className="text-xs text-slate-600">
                                {selectedWarehouse.location || "Location not specified"}
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-800">
                        Dashboard could not be loaded
                    </p>

                    <p className="mt-1 text-xs text-rose-700">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => loadDashboard()}
                        className="mt-3 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <section>
                <SectionHeading
                    title="Inventory Overview"
                    subtitle={
                        selectedWarehouse
                            ? `Summary for ${selectedWarehouse.name}`
                            : "Summary across accessible warehouses"
                    }
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {[
                        [
                            "Total Products",
                            summary.totalProducts,
                            "▦",
                            "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
                        ],
                        [
                            "Warehouses",
                            summary.totalWarehouses,
                            "⌂",
                            "bg-gradient-to-br from-violet-600 to-indigo-700 text-white",
                        ],
                        [
                            "Inventory Units",
                            summary.totalInventoryUnits,
                            "▤",
                            "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
                        ],
                        [
                            "Low Stock Items",
                            summary.lowStockCount,
                            "!",
                            "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950",
                        ],
                        [
                            "Stock Valuation",
                            `₹${number(summary.totalStockValuation || 0)}`,
                            "₹",
                            "bg-gradient-to-br from-indigo-700 to-sky-700 text-white",
                            true,
                        ],
                    ].map(([label, value, icon, color, isCustomStr]) => (
                        <Card
                            key={label}
                            className="p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold opacity-90">
                                        {label}
                                    </p>

                                    <div className="mt-3">
                                        {loading && !dashboard ? (
                                            <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                        ) : (
                                            <p className="text-2xl font-extrabold tracking-tight">
                                                {isCustomStr ? value : number(value)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <span
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl font-bold ${color}`}
                                >
                                    {icon}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Stock Analytics */}
            <section>
                <SectionHeading
                    title="Stock Analytics"
                    subtitle="Daily stock movement and current inventory for the selected warehouse"
                />

                <StockCharts
                    chartData={chartData}
                    stockTotals={stockTotals}
                    dateLabel={dateLabel}
                    number={number}
                />
            </section>

            {/* Warehouse Inventory */}
            <section>
                <SectionHeading
                    title="Warehouse Inventory"
                    subtitle="Inventory details for each warehouse returned by the API"
                />

                {!warehouseStock.length ? (
                    <EmptyState>
                        No warehouse inventory summary available.
                    </EmptyState>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {warehouseStock.map((item) => (
                            <button
                                type="button"
                                key={item.warehouseId}
                                onClick={() =>
                                    changeWarehouse(String(item.warehouseId))
                                }
                                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${String(item.warehouseId) === String(warehouseId)
                                        ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-100"
                                        : "border-slate-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {item.warehouseName}
                                        </h3>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {item.location || "Location not specified"}
                                        </p>
                                    </div>

                                    <span className="text-xl text-blue-600">
                                        ⌂
                                    </span>
                                </div>

                                <p className="mt-5 text-xs font-medium text-slate-500">
                                    Current Units
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-950">
                                    {number(item.totalUnits)}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                        {number(item.uniqueProducts)} products
                                    </span>

                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                        {number(item.inventoryRecords)} records
                                    </span>
                                </div>

                                <p className="mt-3 text-xs font-semibold text-blue-700">
                                    View Warehouse →
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Warehouse Team */}
            <section>
                <SectionHeading
                    title="Warehouse Team"
                    subtitle={
                        selectedWarehouse
                            ? `Inventory managers and staff assigned to ${selectedWarehouse.name}`
                            : "Select one warehouse to see its assigned team"
                    }
                />

                {!warehouseId ? (
                    <EmptyState>
                        Select a warehouse above to view its assigned inventory managers and staff.
                    </EmptyState>
                ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

                        {/* Inventory Managers */}
                        <Card className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Inventory Managers
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Managers assigned to this warehouse
                                    </p>
                                </div>

                                <span className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                                    {managers.length}{" "}
                                    {managers.length === 1 ? "manager" : "managers"}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2.5">
                                {managers.length ? (
                                    managers.map((manager) => (
                                        <div
                                            key={manager.id}
                                            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/40"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                                                {(manager.name || "M")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-900">
                                                    {manager.name}
                                                </p>

                                                <p className="mt-1 truncate text-[11px] text-slate-500">
                                                    {manager.email || `User ID: ${manager.id}`}
                                                </p>
                                            </div>

                                            <span className="ml-auto shrink-0 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[10px] font-bold text-violet-700">
                                                Manager
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState>
                                        No inventory managers are assigned to this warehouse.
                                    </EmptyState>
                                )}
                            </div>
                        </Card>

                        {/* Warehouse Staff */}
                        <Card className="p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Warehouse Staff
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Staff assigned to this warehouse
                                    </p>
                                </div>

                                <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                                    {staff.length}{" "}
                                    {staff.length === 1 ? "member" : "members"}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2.5">
                                {staff.length ? (
                                    staff.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-blue-50/30"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                {(member.name || "S")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-slate-900">
                                                    {member.name}
                                                </p>

                                                <p className="mt-1 truncate text-[11px] text-slate-500">
                                                    {member.email || `User ID: ${member.id}`}
                                                </p>
                                            </div>

                                            <span className="ml-auto rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">
                                                Staff
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState>
                                        No warehouse-specific staff data was returned by the API.
                                    </EmptyState>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </section>

            {/* Orders Overview */}
            <section>
                <SectionHeading
                    title="Orders Overview"
                    subtitle="Purchase and sales order status counts"
                />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {[
                        {
                            title: "Purchase Orders",
                            values: [
                                ["Total", purchase.total],
                                ["Draft", purchase.draft],
                                ["Ordered", purchase.ordered],
                                ["Received", purchase.received],
                                ["Cancelled", purchase.cancelled],
                                ["Pending", purchase.pending],
                                ["Overdue", purchase.overdue],
                            ],
                        },
                        {
                            title: "Sales Orders",
                            values: [
                                ["Total", sales.total],
                                ["Draft", sales.draft],
                                ["Confirmed", sales.confirmed],
                                ["Dispatched", sales.dispatched],
                                ["Cancelled", sales.cancelled],
                                ["Pending", sales.pending],
                            ],
                        },
                    ].map((group) => (
                        <Card
                            key={group.title}
                            className="p-4 sm:p-5"
                        >
                            <h3 className="text-sm font-bold text-slate-900">
                                {group.title}
                            </h3>

                            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                {group.values.map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                                    >
                                        <p className="text-[11px] text-slate-500">
                                            {label}
                                        </p>

                                        <p className="mt-1.5 text-xl font-bold text-slate-900">
                                            {number(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Low Stock Alerts & 1-Click Reorder */}
            <section>
                <SectionHeading
                    title="Low-stock Alerts & Reorder"
                    subtitle="Items below reorder level with runout forecasting & 1-click reorder"
                />

                {reorderSuccessMsg && (
                    <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
                        <span>✓ {reorderSuccessMsg}</span>
                        <button
                            type="button"
                            onClick={() => setReorderSuccessMsg("")}
                            className="text-emerald-600 hover:text-emerald-900 dark:hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <Card className="p-4 sm:p-5">
                    {(alerts.lowStockItems || []).length === 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                No low-stock items reported
                            </p>

                            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                                All inventory levels across warehouses are healthy.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.lowStockItems.map((item, index) => {
                                const isCritical = item.daysRemaining <= 3;
                                const isWarning = item.daysRemaining > 3 && item.daysRemaining <= 7;

                                return (
                                    <div
                                        key={item.id || item.inventoryId || index}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                                    isCritical
                                                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                                                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                                }`}
                                            >
                                                <span className="text-xs font-bold">!</span>
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {item.product?.name ||
                                                            item.productName ||
                                                            `Inventory #${item.id || item.inventoryId}`}
                                                    </p>

                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                                            isCritical
                                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                                                : isWarning
                                                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                        }`}
                                                    >
                                                        ⚡ Runout in {item.daysRemaining !== undefined ? `${item.daysRemaining}d` : "N/A"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                    {item.warehouse?.name || item.warehouseName || "Warehouse"} · Current:{" "}
                                                    <strong className="text-slate-800 dark:text-slate-200">{number(item.quantity)} units</strong> (Reorder Level: {number(item.reorderLevel)})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => triggerAutoReorder(item)}
                                                disabled={reorderingId === item.id}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                            >
                                                {reorderingId === item.id ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                                                        Generating PO...
                                                    </span>
                                                ) : (
                                                    <span>⚡ 1-Click Reorder ({item.suggestedReorderQuantity || 20})</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </section>

            {/* Stock Movement History */}
            <section>
                <SectionHeading
                    title="Stock IN / OUT History"
                    subtitle={
                        selectedWarehouse
                            ? `Movement history for ${selectedWarehouse.name}`
                            : "Movement history across accessible warehouses"
                    }
                />

                <Card className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Stock Movement Records
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Page {currentPage} of {totalPages} ·{" "}
                                {number(totalRecords)} records
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                IN: {number(stockTotals.stockIn)}
                            </span>

                            <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                                OUT: {number(stockTotals.stockOut)}
                            </span>
                        </div>
                    </div>

                    {loading && !dashboard ? (
                        <div className="space-y-3 p-5">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="p-5">
                            <EmptyState>
                                No stock IN / OUT records found.
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3.5">
                                            Type
                                        </th>

                                        <th className="px-5 py-3.5">
                                            Product
                                        </th>

                                        <th className="px-5 py-3.5">
                                            Warehouse
                                        </th>

                                        <th className="px-5 py-3.5">
                                            Quantity
                                        </th>

                                        <th className="px-5 py-3.5">
                                            Performed By
                                        </th>

                                        <th className="px-5 py-3.5">
                                            Date &amp; Time
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {movements.map((movement) => {
                                        const isIn = movement.type === "IN";

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${isIn
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-orange-50 text-orange-700"
                                                            }`}
                                                    >
                                                        {isIn
                                                            ? "↑ Stock IN"
                                                            : "↓ Stock OUT"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {movement.inventory?.product?.name || "—"}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {movement.inventory?.product?.sku ||
                                                            `Inventory #${movement.inventoryId}`}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-3.5 text-xs text-slate-700">
                                                    {movement.inventory?.warehouse?.name || "—"}
                                                </td>

                                                <td
                                                    className={`px-5 py-3.5 text-xs font-bold ${isIn
                                                            ? "text-emerald-700"
                                                            : "text-orange-700"
                                                        }`}
                                                >
                                                    {isIn ? "+" : "−"}
                                                    {number(movement.quantity)}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <p className="text-xs font-semibold text-slate-800">
                                                        {movement.user?.name ||
                                                            `User #${movement.userId}`}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {Number(movement.user?.roleId) === 1
                                                            ? "Admin"
                                                            : Number(movement.user?.roleId) === 4
                                                                ? "Inventory Manager"
                                                                : Number(movement.user?.roleId) === 5
                                                                    ? "Warehouse Staff"
                                                                    : "User"}
                                                    </p>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-600">
                                                    {dateTime(movement.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-xs text-slate-500">
                            Showing{" "}
                            {movements.length
                                ? (currentPage - 1) * LIMIT + 1
                                : 0}
                            {"–"}
                            {Math.min(
                                (currentPage - 1) * LIMIT + movements.length,
                                totalRecords
                            )}
                            {" of "}
                            {number(totalRecords)}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() =>
                                    setPage((value) => Math.max(1, value - 1))
                                }
                                className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ← Previous
                            </button>

                            <span className="min-w-16 text-center text-xs font-semibold text-slate-700">
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() =>
                                    setPage((value) =>
                                        Math.min(totalPages, value + 1)
                                    )
                                }
                                className="min-h-9 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </Card>
            </section>

            <p className="text-center text-[11px] text-slate-400">
                StockPilot · Inventory Management
            </p>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <DashboardContent />
        </AuthGuard>
    );
}
