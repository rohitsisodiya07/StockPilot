
"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

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
        <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {title}
            </h2>
            {subtitle && (
                <p className="mt-1 text-base text-slate-500">{subtitle}</p>
            )}
        </div>
    );
}

function EmptyState({ children = "No data available." }) {
    return (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-base text-slate-500">
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

    const loadDashboard = useCallback(async ({
        selectedWarehouse = warehouseId,
        selectedPage = page,
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
        loadDashboard({ selectedWarehouse: warehouseId, selectedPage: page });
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

    // This list must be returned by the backend for the selected warehouse.
    const warehouseUsers = options.warehouseUsers || {};
    const managers = warehouseUsers.managers || [];
    const staff = warehouseUsers.staff || [];

    // Prefer server pagination. The local fallback only paginates
    // the records returned by the API; it cannot fetch missing records.
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

    const selectedStock = warehouseStock.find(
        (item) => String(item.warehouseId) === String(warehouseId)
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
        <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
            {/* Header */}
            <Card className="relative overflow-hidden border-blue-100 bg-gradient-to-r from-blue-50 via-sky-50 to-white p-6 sm:p-9">
                <div className="relative z-10">
                    <p className="text-base font-medium text-slate-500">
                        Home / Dashboard
                    </p>

                    <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                                Warehouse Dashboard
                            </h1>
                            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                                View inventory levels, warehouse users, stock movement,
                                and order activity for a selected warehouse.
                            </p>
                        </div>

                        <button
                            onClick={exportCsv}
                            disabled={!dashboard || loading}
                            className="min-h-12 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            ↓ Export CSV
                        </button>
                    </div>
                </div>
                <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/70" />
            </Card>

            {/* Warehouse selector */}
            <Card className="p-5 sm:p-7">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <label className="block">
                        <span className="mb-2 block text-base font-semibold text-slate-700">
                            Select warehouse
                        </span>
                        <select
                            value={warehouseId}
                            onChange={(event) => changeWarehouse(event.target.value)}
                            className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        >
                            <option value="">All accessible warehouses</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                    {warehouse.location ? ` — ${warehouse.location}` : ""}
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
                            })
                        }
                        disabled={loading}
                        className="min-h-14 rounded-xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "↻ Refresh"}
                    </button>
                </div>

                {selectedWarehouse && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 p-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl text-blue-700">
                            ⌂
                        </span>
                        <div>
                            <p className="text-lg font-bold text-slate-900">
                                {selectedWarehouse.name}
                            </p>
                            <p className="text-base text-slate-600">
                                {selectedWarehouse.location || "Location not specified"}
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="text-base font-semibold text-rose-800">
                        Dashboard could not be loaded
                    </p>
                    <p className="mt-1 text-base text-rose-700">{error}</p>
                    <button
                        onClick={() => loadDashboard()}
                        className="mt-3 rounded-lg bg-white px-4 py-2 text-base font-semibold text-rose-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Summary */}
            <section>
                <SectionHeading
                    title="Inventory overview"
                    subtitle={
                        selectedWarehouse
                            ? `Summary for ${selectedWarehouse.name}`
                            : "Summary across accessible warehouses"
                    }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Total Products", summary.totalProducts, "▦", "bg-gradient-to-br from-blue-600 to-blue-700 text-white"],
                        ["Warehouses", summary.totalWarehouses, "⌂", "bg-gradient-to-br from-violet-600 to-indigo-700 text-white"],
                        ["Inventory Units", summary.totalInventoryUnits, "▤", "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"],
                        ["Low Stock Items", summary.lowStockCount, "!", "bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950"],
                    ].map(([label, value, icon, color]) => (
                        <Card key={label} className="p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-base font-semibold opacity-90">
                                        {label}
                                    </p>
                                    <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                        {loading && !dashboard ? "…" : number(value)}
                                    </p>
                                </div>
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold ${color}`}>
                                    {icon}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Stock charts */}
            <section>
                <SectionHeading
                    title="Stock analytics"
                    subtitle="Daily stock movement and current inventory for the selected warehouse"
                />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <Card className="p-5 sm:p-7">
                        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                            Stock IN vs OUT
                        </h3>
                        <p className="mt-1 text-base text-slate-500">
                            Daily quantity comparison
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-emerald-50 p-4">
                                <p className="text-base font-medium text-emerald-700">
                                    Total IN
                                </p>
                                <p className="mt-2 text-2xl font-bold text-emerald-800">
                                    {number(stockTotals.stockIn)}
                                </p>
                            </div>
                            <div className="rounded-xl bg-orange-50 p-4">
                                <p className="text-base font-medium text-orange-700">
                                    Total OUT
                                </p>
                                <p className="mt-2 text-2xl font-bold text-orange-800">
                                    {number(stockTotals.stockOut)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 h-[330px] w-full">
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => {
                                                const date = new Date(`${value}T12:00:00`);
                                                return Number.isNaN(date.getTime())
                                                    ? value
                                                    : date.toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                    });
                                            }}
                                            tick={{ fontSize: 12 }}
                                            minTickGap={18}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 13 }}
                                        />
                                        <Tooltip labelFormatter={dateLabel} />
                                        <Legend wrapperStyle={{ fontSize: 14 }} />
                                        <Bar
                                            dataKey="stockIn"
                                            name="Stock IN"
                                            fill="#059669"
                                            radius={[5, 5, 0, 0]}
                                        />
                                        <Bar
                                            dataKey="stockOut"
                                            name="Stock OUT"
                                            fill="#ea580c"
                                            radius={[5, 5, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState>No stock movement chart data returned.</EmptyState>
                            )}
                        </div>
                    </Card>

                    <Card className="p-5 sm:p-7">
                        <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                            Inventory trend
                        </h3>
                        <p className="mt-1 text-base text-slate-500">
                            Daily IN and OUT trend
                        </p>

                        <div className="mt-5 h-[330px] w-full">
                            {chartData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(value) => {
                                                const date = new Date(`${value}T12:00:00`);
                                                return Number.isNaN(date.getTime())
                                                    ? value
                                                    : date.toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                    });
                                            }}
                                            tick={{ fontSize: 12 }}
                                            minTickGap={18}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 13 }}
                                        />
                                        <Tooltip labelFormatter={dateLabel} />
                                        <Legend wrapperStyle={{ fontSize: 14 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="stockIn"
                                            name="Stock IN"
                                            stroke="#059669"
                                            strokeWidth={3}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="stockOut"
                                            name="Stock OUT"
                                            stroke="#ea580c"
                                            strokeWidth={3}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState>No stock trend data returned.</EmptyState>
                            )}
                        </div>
                    </Card>
                </div>
            </section>

            {/* Selected warehouse inventory */}
            <section>
                <SectionHeading
                    title="Warehouse inventory"
                    subtitle="Inventory details for each warehouse returned by the API"
                />

                {!warehouseStock.length ? (
                    <EmptyState>No warehouse inventory summary available.</EmptyState>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {warehouseStock.map((item) => (
                            <button
                                type="button"
                                key={item.warehouseId}
                                onClick={() => changeWarehouse(String(item.warehouseId))}
                                className={`rounded-2xl border p-5 text-left transition hover:shadow-md sm:p-6 ${String(item.warehouseId) === String(warehouseId)
                                    ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-100"
                                    : "border-slate-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {item.warehouseName}
                                        </h3>
                                        <p className="mt-1 text-base text-slate-500">
                                            {item.location || "Location not specified"}
                                        </p>
                                    </div>
                                    <span className="text-2xl text-blue-600">⌂</span>
                                </div>
                                <p className="mt-6 text-sm font-medium text-slate-500">
                                    Current units
                                </p>
                                <p className="mt-1 text-3xl font-bold text-slate-950">
                                    {number(item.totalUnits)}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                                        {number(item.uniqueProducts)} products
                                    </span>
                                    <span className="rounded-lg bg-slate-100 px-3 py-2">
                                        {number(item.inventoryRecords)} records
                                    </span>
                                </div>
                                <p className="mt-4 text-sm font-semibold text-blue-700">
                                    View warehouse →
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Inventory managers and warehouse staff */}
            <section>
                <SectionHeading
                    title="Warehouse team"
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
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                        <Card className="p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                                        Inventory Managers
                                    </h3>
                                    <p className="mt-1 text-base text-slate-500">
                                        Managers assigned to this warehouse
                                    </p>
                                </div>
                                <span className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">
                                    {managers.length} {managers.length === 1 ? "manager" : "managers"}
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {managers.length ? managers.map((manager) => (
                                    <div
                                        key={manager.id}
                                        className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                                            {(manager.name || "M").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-semibold text-slate-900">
                                                {manager.name}
                                            </p>
                                            <p className="mt-1 truncate text-sm text-slate-500">
                                                {manager.email || `User ID: ${manager.id}`}
                                            </p>
                                        </div>
                                        <span className="ml-auto shrink-0 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                                            Manager
                                        </span>
                                    </div>
                                )) : (
                                    <EmptyState>
                                        No inventory managers are assigned to this warehouse.
                                    </EmptyState>
                                )}
                            </div>
                        </Card>

                        <Card className="p-5 sm:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                                        Warehouse staff
                                    </h3>
                                    <p className="mt-1 text-base text-slate-500">
                                        Staff assigned to this warehouse
                                    </p>
                                </div>
                                <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                                    {staff.length} {staff.length === 1 ? "member" : "members"}
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                {staff.length ? staff.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-4 rounded-xl border border-slate-100 p-4"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                                            {(member.name || "S").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-slate-900">
                                                {member.name}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {member.email || `User ID: ${member.id}`}
                                            </p>
                                        </div>
                                        <span className="ml-auto rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                                            Staff
                                        </span>
                                    </div>
                                )) : (
                                    <EmptyState>
                                        No warehouse-specific staff data was returned by the API.
                                    </EmptyState>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </section>

            {/* Orders */}
            <section>
                <SectionHeading
                    title="Orders overview"
                    subtitle="Purchase and sales order status counts"
                />

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {[
                        {
                            title: "Purchase orders",
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
                            title: "Sales orders",
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
                        <Card key={group.title} className="p-5 sm:p-6">
                            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                                {group.title}
                            </h3>
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {group.values.map(([label, value]) => (
                                    <div key={label} className="rounded-xl border border-slate-100 p-4">
                                        <p className="text-base text-slate-500">{label}</p>
                                        <p className="mt-2 text-2xl font-bold text-slate-900">
                                            {number(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Low stock alerts */}
            <section>
                <SectionHeading
                    title="Low-stock alerts"
                    subtitle="Items at or below their reorder level"
                />

                <Card className="p-5 sm:p-6">
                    {(alerts.lowStockItems || []).length === 0 ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                            <p className="text-lg font-bold text-emerald-900">
                                No low-stock items reported
                            </p>
                            <p className="mt-1 text-base text-emerald-800">
                                The current API response contains no items below reorder level.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.lowStockItems.map((item, index) => (
                                <div
                                    key={item.id || item.inventoryId || index}
                                    className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-base font-bold text-slate-900">
                                            {item.product?.name || item.productName || `Inventory #${item.id || item.inventoryId}`}
                                        </p>
                                        <p className="mt-1 text-base text-slate-600">
                                            {item.warehouse?.name || item.warehouseName || ""}
                                        </p>
                                    </div>
                                    <p className="text-base font-semibold text-amber-800">
                                        Quantity: {number(item.quantity)} / Reorder: {number(item.reorderLevel)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </section>

            {/* IN / OUT activity table with pagination */}
            <section>
                <SectionHeading
                    title="Stock IN / OUT history"
                    subtitle={
                        selectedWarehouse
                            ? `Movement history for ${selectedWarehouse.name}`
                            : "Movement history across accessible warehouses"
                    }
                />

                <Card className="overflow-hidden">
                    <div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Stock movement records
                            </h3>
                            <p className="mt-1 text-base text-slate-500">
                                Page {currentPage} of {totalPages} · {number(totalRecords)} records
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                                IN: {number(stockTotals.stockIn)}
                            </span>
                            <span className="rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
                                OUT: {number(stockTotals.stockOut)}
                            </span>
                        </div>
                    </div>

                    {loading && !dashboard ? (
                        <div className="space-y-3 p-5">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                            ))}
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="p-5">
                            <EmptyState>No stock IN / OUT records found.</EmptyState>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4">Product</th>
                                        <th className="px-5 py-4">Warehouse</th>
                                        <th className="px-5 py-4">Quantity</th>
                                        <th className="px-5 py-4">Performed by</th>
                                        <th className="px-5 py-4">Date &amp; time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movements.map((movement) => {
                                        const isIn = movement.type === "IN";

                                        return (
                                            <tr key={movement.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-lg px-3 py-2 text-sm font-bold ${isIn ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                                                        {isIn ? "↑ Stock IN" : "↓ Stock OUT"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-base font-semibold text-slate-800">
                                                        {movement.inventory?.product?.name || "—"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {movement.inventory?.product?.sku || `Inventory #${movement.inventoryId}`}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-base text-slate-700">
                                                    {movement.inventory?.warehouse?.name || "—"}
                                                </td>
                                                <td className={`px-5 py-4 text-base font-bold ${isIn ? "text-emerald-700" : "text-orange-700"}`}>
                                                    {isIn ? "+" : "−"}{number(movement.quantity)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-base font-semibold text-slate-800">
                                                        {movement.user?.name || `User #${movement.userId}`}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {Number(movement.user?.roleId) === 1
                                                            ? "Admin"
                                                            : Number(movement.user?.roleId) === 4
                                                                ? "Inventory Manager"
                                                                : Number(movement.user?.roleId) === 5
                                                                    ? "Warehouse Staff"
                                                                    : "User"}
                                                    </p>
                                                </td>
                                                <td className="whitespace-nowrap px-5 py-4 text-base text-slate-600">
                                                    {dateTime(movement.createdAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 border-t border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-base text-slate-500">
                            Showing {movements.length ? (currentPage - 1) * LIMIT + 1 : 0}
                            {"–"}
                            {Math.min((currentPage - 1) * LIMIT + movements.length, totalRecords)}
                            {" of "}
                            {number(totalRecords)}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                                className="min-h-11 rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                ← Previous
                            </button>
                            <span className="min-w-24 text-center text-base font-semibold text-slate-700">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                className="min-h-11 rounded-xl border border-slate-200 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </Card>
            </section>

            <p className="text-center text-sm text-slate-400">
                StockPilot · Inventory Management
            </p>
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <AdminLayout>
                <DashboardContent />
            </AdminLayout>
        </AuthGuard>
    );
}
