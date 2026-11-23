
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";
import dynamic from "next/dynamic";

const ManagerStockChart = dynamic(
    () => import("@/components/dashboard/ManagerStockChart"),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[280px] w-full items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            </div>
        ),
    }
);

const LIMIT = 10;

const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-IN");

const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getWarehouseId = (warehouse) =>
    warehouse?.id ?? warehouse?.warehouseId;

const getWarehouseName = (warehouse) =>
    warehouse?.warehouseName || warehouse?.name || "Warehouse";

// Dashboard API uses Sequelize's lowercase association aliases.
// Keep fallbacks so the UI also tolerates older/flattened response shapes.
const getLowStockProductName = (item) =>
    item?.product?.name ||
    item?.product?.productName ||
    item?.Product?.productName ||
    item?.Product?.name ||
    item?.productName ||
    "-";

const getLowStockWarehouseName = (item) =>
    item?.warehouse?.name ||
    item?.warehouse?.warehouseName ||
    item?.Warehouse?.warehouseName ||
    item?.warehouseName ||
    "-";

const getMovementProductName = (item) =>
    item?.inventory?.product?.name ||
    item?.inventory?.product?.productName ||
    item?.Product?.productName ||
    item?.Product?.name ||
    item?.productName ||
    "-";

const getMovementWarehouseName = (item) =>
    item?.inventory?.warehouse?.name ||
    item?.inventory?.warehouse?.warehouseName ||
    item?.Warehouse?.warehouseName ||
    item?.warehouseName ||
    "-";

const getMovementUserName = (item) =>
    item?.user?.name ||
    item?.User?.name ||
    item?.userName ||
    item?.user?.email ||
    "-";

function SummaryCard({ title, value, description, icon, isCustom }) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{title}</p>
                <span className="text-xl">{icon}</span>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                {isCustom ? value : formatNumber(value)}
            </h2>

            <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">{description}</p>
        </div>
    );
}

function SectionHeading({ title, description, action }) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                {description && (
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}

function StatusBadge({ status }) {
    const value = String(status || "").toUpperCase();

    const styles = {
        IN: "bg-green-50 text-green-700",
        OUT: "bg-orange-50 text-orange-700",
        DRAFT: "bg-gray-100 text-gray-600",
        ORDERED: "bg-blue-50 text-blue-700",
        RECEIVED: "bg-green-50 text-green-700",
        CONFIRMED: "bg-blue-50 text-blue-700",
        DISPATCHED: "bg-purple-50 text-purple-700",
        CANCELLED: "bg-red-50 text-red-700",
    };

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[value] || "bg-gray-100 text-gray-600"
                }`}
        >
            {value || "-"}
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <div className="py-8 text-center text-xs text-gray-500">{message}</div>
    );
}

function LoadingRows() {
    return (
        <div className="space-y-3 py-4">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="h-9 animate-pulse rounded-lg bg-gray-100"
                />
            ))}
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
            setReorderingId(item.id || item.inventoryId);
            setReorderSuccessMsg("");
            const res = await api.post("/inventory/auto-reorder", {
                productId: item.productId,
                warehouseId: item.warehouseId,
                quantity: item.suggestedReorderQuantity,
            });

            if (res.data?.success) {
                setReorderSuccessMsg(res.data.message);
                loadDashboard(true);
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to trigger auto reorder");
        } finally {
            setReorderingId(null);
        }
    };

    const loadDashboard = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit: LIMIT,
            };

            if (warehouseId) {
                params.warehouseId = warehouseId;
            }

            if (forceRefresh === true) {
                params.refresh = "true";
            }

            const response = await api.get("/dashboard", { params });

            if (response.data?.success) {
                setDashboard(response.data.data);
            } else {
                setError(
                    response.data?.message || "Unable to load dashboard."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [page, warehouseId]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const summary = dashboard?.summary || {};
    const options = dashboard?.options || {};
    const stockAnalytics = dashboard?.stockAnalytics || {};
    const activity = dashboard?.activity || {};
    const orders = dashboard?.orders || {};
    const alerts = dashboard?.alerts || {};

    // Only warehouses returned by the assigned-warehouse API are displayed.
    const warehouses = options.warehouses || [];

    const chartData = stockAnalytics.chartData || [];
    const warehouseStock = stockAnalytics.warehouseStock || [];
    const movements = activity.recentStockMovements || [];
    const lowStockItems = alerts.lowStockItems || [];

    const pagination = activity.pagination || {};

    const selectedWarehouse = useMemo(
        () =>
            warehouses.find(
                (warehouse) =>
                    String(getWarehouseId(warehouse)) === String(warehouseId)
            ),
        [warehouses, warehouseId]
    );

    const stockTotals = useMemo(
        () =>
            chartData.reduce(
                (total, item) => ({
                    stockIn: total.stockIn + Number(item.stockIn || 0),
                    stockOut: total.stockOut + Number(item.stockOut || 0),
                }),
                { stockIn: 0, stockOut: 0 }
            ),
        [chartData]
    );

    const handleWarehouseChange = (value) => {
        setWarehouseId(value);
        setPage(1);
    };

    const exportCSV = () => {
        const rows = [
            ["StockPilot Inventory Dashboard"],
            ["Report Date", new Date().toLocaleDateString("en-IN")],
            [],
            ["Summary"],
            ["Total Products", summary.totalProducts || 0],
            ["Total Warehouses", summary.totalWarehouses || 0],
            ["Inventory Units", summary.totalInventoryUnits || 0],
            ["Low Stock Items", summary.lowStockCount || 0],
            [],
            ["Warehouse Stock"],
            ["Warehouse", "Location", "Products", "Total Units"],
            ...warehouseStock.map((item) => [
                item.warehouseName || "",
                item.location || "",
                item.uniqueProducts || 0,
                item.totalUnits || 0,
            ]),
            [],
            ["Low Stock Items"],
            ["Product", "Warehouse", "Quantity"],
            ...lowStockItems.map((item) => [
                getLowStockProductName(item),
                getLowStockWarehouseName(item),
                item.quantity ?? item.stockQuantity ?? "",
            ]),
            [],
            ["Recent Stock Movements - Current Page"],
            ["Date", "Product", "Warehouse", "Type", "Quantity"],
            ...movements.map((item) => [
                item.createdAt || "",
                getMovementProductName(item),
                getMovementWarehouseName(item),
                item.type || "",
                item.quantity || 0,
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "inventory-manager-dashboard.csv";
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const totalPages = pagination.totalPages || 1;
    const totalRecords = pagination.totalRecords || 0;

    const purchaseOrders = orders.purchaseOrders || {};
    const salesOrders = orders.salesOrders || {};

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                        Inventory Dashboard
                    </h1>
                    <p className="mt-1 text-xs text-gray-500">
                        Monitor your assigned warehouses, inventory and stock activity.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Assigned warehouse selector */}
                    {warehouses.length > 0 && (
                        <select
                            value={warehouseId}
                            onChange={(e) => handleWarehouseChange(e.target.value)}
                            className="min-w-[190px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                        >
                            <option value="">All Assigned Warehouses</option>

                            {warehouses.map((warehouse) => (
                                <option
                                    key={getWarehouseId(warehouse)}
                                    value={getWarehouseId(warehouse)}
                                >
                                    {getWarehouseName(warehouse)}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => loadDashboard(true)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
                    >
                        <span className={`text-xs ${loading ? "animate-spin inline-block" : ""}`}>↻</span>
                        <span>{loading ? "Refreshing..." : "Refresh"}</span>
                    </button>

                    <button
                        onClick={exportCSV}
                        disabled={!dashboard}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                </div>
            )}

            {/* No assigned warehouses */}
            {!loading && dashboard && !error && warehouses.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="text-sm font-semibold text-amber-800">
                        No Warehouse Assigned
                    </h3>
                    <p className="mt-1 text-xs text-amber-700">
                        No warehouse has been assigned to your account yet. Please contact
                        your administrator.
                    </p>
                </div>
            )}

            {/* Summary cards */}
            {loading && !dashboard ? (
                <LoadingRows />
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <SummaryCard
                        title="Total Products"
                        value={summary.totalProducts}
                        description="Products in accessible warehouses"
                        icon="📦"
                    />
                    <SummaryCard
                        title="My Warehouses"
                        value={summary.totalWarehouses}
                        description="Assigned warehouses"
                        icon="🏭"
                    />
                    <SummaryCard
                        title="Inventory Units"
                        value={summary.totalInventoryUnits}
                        description="Available inventory quantity"
                        icon="📊"
                    />
                    <SummaryCard
                        title="Low Stock Items"
                        value={summary.lowStockCount}
                        description="Items requiring attention"
                        icon="⚠️"
                    />
                    <SummaryCard
                        title="Stock Valuation"
                        value={summary.totalStockValuation ? `₹${formatNumber(summary.totalStockValuation)}` : "₹0"}
                        description="Holding inventory value"
                        icon="💰"
                        isCustom
                    />
                </div>
            )}

            {/* Stock analytics */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 xl:col-span-2">
                    <SectionHeading
                        title="Stock Movement Analytics"
                        description={`Stock IN and OUT from ${formatDate(
                            stockAnalytics.chartStartDate
                        )} to ${formatDate(stockAnalytics.chartEndDate)}`}
                    />

                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-green-50 p-3">
                            <p className="text-[11px] text-green-700">Period Stock IN</p>
                            <p className="mt-1 text-xl font-bold text-green-800">
                                {formatNumber(stockTotals.stockIn)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-orange-50 p-3">
                            <p className="text-[11px] text-orange-700">Period Stock OUT</p>
                            <p className="mt-1 text-xl font-bold text-orange-800">
                                {formatNumber(stockTotals.stockOut)}
                            </p>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ManagerStockChart chartData={chartData} />
                    </div>
                </div>

                {/* Order summary */}
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <SectionHeading
                        title="Order Summary"
                        description="Purchase and sales order overview"
                    />

                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-2 text-xs font-semibold text-gray-700">
                                Purchase Orders
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-blue-50 p-3">
                                    <p className="text-[10px] text-blue-600">Total</p>
                                    <p className="text-lg font-bold text-blue-800">
                                        {formatNumber(purchaseOrders.total)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-amber-50 p-3">
                                    <p className="text-[10px] text-amber-600">Pending</p>
                                    <p className="text-lg font-bold text-amber-800">
                                        {formatNumber(purchaseOrders.pending)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-xs font-semibold text-gray-700">
                                Sales Orders
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-purple-50 p-3">
                                    <p className="text-[10px] text-purple-600">Total</p>
                                    <p className="text-lg font-bold text-purple-800">
                                        {formatNumber(salesOrders.total)}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-amber-50 p-3">
                                    <p className="text-[10px] text-amber-600">Pending</p>
                                    <p className="text-lg font-bold text-amber-800">
                                        {formatNumber(salesOrders.pending)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouse stock */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <SectionHeading
                    title="Warehouse Stock Summary"
                    description={
                        selectedWarehouse
                            ? `Inventory overview for ${getWarehouseName(selectedWarehouse)}`
                            : "Inventory overview across your assigned warehouses"
                    }
                />

                {warehouseStock.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {warehouseStock.map((item, index) => (
                            <div
                                key={item.warehouseId || item.id || index}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                            >
                                <h3 className="text-xs font-semibold text-gray-800">
                                    {item.warehouseName || "Warehouse"}
                                </h3>

                                <p className="mt-1 text-[11px] text-gray-500">
                                    {item.location || "Location not available"}
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-gray-500">
                                            Unique Products
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {formatNumber(item.uniqueProducts)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-gray-500">Total Units</p>
                                        <p className="mt-1 text-lg font-bold text-gray-900">
                                            {formatNumber(item.totalUnits)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                            width: `${item.inventoryRecords
                                                ? Math.min(
                                                    100,
                                                    (Number(item.uniqueProducts || 0) /
                                                        Number(item.inventoryRecords || 1)) *
                                                    100
                                                )
                                                : 0
                                                }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No warehouse stock data available." />
                )}
            </div>

            {/* Low stock alerts */}
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <SectionHeading
                    title="Low Stock Alerts & Depletion Forecasting"
                    description="Products below threshold with estimated runout days and 1-click reorder"
                />

                {reorderSuccessMsg && (
                    <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
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

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-slate-800 text-[10px] uppercase text-gray-500 dark:text-slate-400">
                                <th className="px-3 py-3 font-semibold">Product</th>
                                <th className="px-3 py-3 font-semibold">Warehouse</th>
                                <th className="px-3 py-3 font-semibold">Quantity</th>
                                <th className="px-3 py-3 font-semibold">Runout Forecast</th>
                                <th className="px-3 py-3 text-right font-semibold">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {lowStockItems.length > 0 ? (
                                lowStockItems.map((item, index) => {
                                    const isCritical = item.daysRemaining <= 3;
                                    const isWarning = item.daysRemaining > 3 && item.daysRemaining <= 7;
                                    const currentId = item.id || item.inventoryId;

                                    return (
                                        <tr
                                            key={currentId || index}
                                            className="border-b border-gray-100 dark:border-slate-800 text-xs last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                        >
                                            <td className="px-3 py-3 font-medium text-gray-800 dark:text-slate-200">
                                                {getLowStockProductName(item)}
                                            </td>

                                            <td className="px-3 py-3 text-gray-600 dark:text-slate-400">
                                                {getLowStockWarehouseName(item)}
                                            </td>

                                            <td className="px-3 py-3 font-semibold text-gray-800 dark:text-slate-200">
                                                {formatNumber(
                                                    item.quantity ?? item.stockQuantity
                                                )}{" "}
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    (Reorder: {formatNumber(item.reorderLevel || 10)})
                                                </span>
                                            </td>

                                            <td className="px-3 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                        isCritical
                                                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                                            : isWarning
                                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                                    }`}
                                                >
                                                    ⚡ Runout in {item.daysRemaining !== undefined ? `${item.daysRemaining}d` : "N/A"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => triggerAutoReorder(item)}
                                                    disabled={reorderingId === currentId}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                                >
                                                    {reorderingId === currentId ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white border-t-transparent" />
                                                            PO...
                                                        </span>
                                                    ) : (
                                                        <span>⚡ Reorder ({item.suggestedReorderQuantity || 20})</span>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState message="No low stock items found." />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Warehouse team */}
            {warehouseId && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <SectionHeading
                        title="Warehouse Team"
                        description={`Team assigned to ${selectedWarehouse
                            ? getWarehouseName(selectedWarehouse)
                            : "selected warehouse"
                            }`}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <h3 className="mb-3 text-xs font-semibold text-gray-800">
                                Inventory Managers
                            </h3>

                            {(options.warehouseUsers?.managers || []).length > 0 ? (
                                options.warehouseUsers.managers.map((user, index) => (
                                    <div
                                        key={user.id || index}
                                        className="border-b border-gray-200 py-2 last:border-0"
                                    >
                                        <p className="text-xs font-medium text-gray-800">
                                            {user.name || user.fullName || "Manager"}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {user.email || ""}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No managers found." />
                            )}
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <h3 className="mb-3 text-xs font-semibold text-gray-800">
                                Warehouse Staff
                            </h3>

                            {(options.warehouseUsers?.staff || []).length > 0 ? (
                                options.warehouseUsers.staff.map((user, index) => (
                                    <div
                                        key={user.id || index}
                                        className="border-b border-gray-200 py-2 last:border-0"
                                    >
                                        <p className="text-xs font-medium text-gray-800">
                                            {user.name || user.fullName || "Staff"}
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            {user.email || ""}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <EmptyState message="No staff found." />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent stock movements */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <SectionHeading
                    title="Recent Stock Movements"
                    description="Latest stock IN and OUT activities"
                />

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left">
                        <thead>
                            <tr className="border-b border-gray-200 text-[10px] uppercase text-gray-500">
                                <th className="px-3 py-3 font-semibold">Date</th>
                                <th className="px-3 py-3 font-semibold">Product</th>
                                <th className="px-3 py-3 font-semibold">Warehouse</th>
                                <th className="px-3 py-3 font-semibold">Type</th>
                                <th className="px-3 py-3 font-semibold">Quantity</th>
                                <th className="px-3 py-3 font-semibold">User</th>
                            </tr>
                        </thead>

                        <tbody>
                            {movements.length > 0 ? (
                                movements.map((item, index) => (
                                    <tr
                                        key={item.id || item.stockMovementId || index}
                                        className="border-b border-gray-100 text-xs last:border-0"
                                    >
                                        <td className="px-3 py-3 text-gray-600">
                                            {formatDate(item.createdAt)}
                                        </td>

                                        <td className="px-3 py-3 font-medium text-gray-800">
                                            {getMovementProductName(item)}
                                        </td>

                                        <td className="px-3 py-3 text-gray-600">
                                            {getMovementWarehouseName(item)}
                                        </td>

                                        <td className="px-3 py-3">
                                            <StatusBadge status={item.type} />
                                        </td>

                                        <td className="px-3 py-3 font-semibold text-gray-800">
                                            {formatNumber(item.quantity)}
                                        </td>

                                        <td className="px-3 py-3 text-gray-600">
                                            {getMovementUserName(item)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState message="No stock movements found." />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <p className="text-[11px] text-gray-500">
                        Showing {movements.length} of {formatNumber(totalRecords)} records
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1 || loading}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-[11px] font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-[11px] text-gray-600">
                            Page {page} of {totalPages}
                        </span>

                        <button
                            onClick={() =>
                                setPage((prev) => Math.min(totalPages, prev + 1))
                            }
                            disabled={page >= totalPages || loading}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-[11px] font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-gray-400">
                StockPilot Inventory Management System
            </p>
        </div>
    );
}

export default function InventoryManagerDashboard() {
    return (
        <AuthGuard allowedRoles={[4]}>
            <DashboardContent />
        </AuthGuard>
    );
}
