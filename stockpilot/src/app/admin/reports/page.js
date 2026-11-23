"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

// ==================================================
// HELPERS
// ==================================================

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const number = (value) =>
    new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

const getData = (response) => response?.data?.data ?? {};

const getArray = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.warehouses)) return data.warehouses;
    if (Array.isArray(data?.data)) return data.data;

    return [];
};

const exportCSV = (filename, rows) => {
    if (!rows?.length) {
        window.alert("No data available to export.");
        return;
    }

    const headers = Object.keys(rows[0]);

    const escapeCSV = (value) => {
        let text = String(value ?? "");
        // Neutralize spreadsheet formulas in exported text cells.
        if (/^[=+@\-\t\r]/.test(text)) text = `\t${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) =>
            headers.map((header) => escapeCSV(row[header])).join(",")
        ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const EMPTY_SALES = {
    totalOrders: 0,
    statusCounts: {
        DRAFT: 0,
        CONFIRMED: 0,
        DISPATCHED: 0,
        CANCELLED: 0,
    },
    dispatchedOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
};

const EMPTY_PURCHASES = {
    totalOrders: 0,
    statusCounts: {
        DRAFT: 0,
        ORDERED: 0,
        RECEIVED: 0,
        CANCELLED: 0,
    },
    receivedOrders: 0,
    receivedPurchaseValue: 0,
    data: [],
};

const EMPTY_INVENTORY = {
    totalItems: 0,
    lowStockItems: 0,
    data: [],
};

const EMPTY_MOVEMENTS = {
    totalMovements: 0,
    totalIn: 0,
    totalOut: 0,
    data: [],
};

// ==================================================
// REUSABLE COMPONENTS
// ==================================================

function SummaryCard({
    title,
    value,
    subtitle,
    icon,
    color = "blue",
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        purple: "bg-violet-50 text-violet-600",
        orange: "bg-orange-50 text-orange-600",
        red: "bg-red-50 text-red-600",
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500">{title}</p>

                    <h3 className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-900">
                        {value}
                    </h3>

                    {subtitle && (
                        <p className="mt-1 text-[11px] text-gray-500">{subtitle}</p>
                    )}
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${colors[color]}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        DRAFT: "bg-gray-100 text-gray-700",
        CONFIRMED: "bg-blue-50 text-blue-700",
        DISPATCHED: "bg-emerald-50 text-emerald-700",
        CANCELLED: "bg-red-50 text-red-700",
        ORDERED: "bg-amber-50 text-amber-700",
        RECEIVED: "bg-emerald-50 text-emerald-700",
        IN: "bg-emerald-50 text-emerald-700",
        OUT: "bg-orange-50 text-orange-700",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status] || "bg-gray-100 text-gray-600"
                }`}
        >
            {status || "-"}
        </span>
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

function ExportButton({ onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
            <span>↓</span>
            Export CSV
        </button>
    );
}

function LoadingState() {
    return (
        <div className="flex min-h-36 items-center justify-center gap-2 text-xs text-gray-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            Loading report...
        </div>
    );
}

function EmptyState({ message = "No records found." }) {
    return (
        <div className="flex min-h-36 flex-col items-center justify-center px-4 py-8 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">
                ▤
            </div>
            <p className="text-xs font-medium text-gray-600">{message}</p>
        </div>
    );
}

function ErrorState({ message, onRetry }) {
    return (
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="text-xs text-red-600">{message}</p>

            <button
                onClick={onRetry}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
                Try again
            </button>
        </div>
    );
}

function ReportTable({
    loading,
    error,
    retry,
    empty,
    children,
}) {
    if (loading) return <LoadingState />;

    if (error) {
        return <ErrorState message={error} onRetry={retry} />;
    }

    if (empty) return <EmptyState />;

    return <div className="overflow-x-auto">{children}</div>;
}

function ProgressBar({ label, value, total, color }) {
    const percentage =
        total > 0 ? Math.min((Number(value || 0) / total) * 100, 100) : 0;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{number(value)}</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

// ==================================================
// MAIN REPORTS COMPONENT
// ==================================================

function ReportsContent() {
    const [activeTab, setActiveTab] = useState("overview");

    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        warehouseId: "",
    });

    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [movementType, setMovementType] = useState("");
    const [purchaseStatus, setPurchaseStatus] = useState("");

    const [warehouses, setWarehouses] = useState([]);

    const [sales, setSales] = useState(EMPTY_SALES);
    const [warehouseSales, setWarehouseSales] = useState([]);
    const [inventory, setInventory] = useState(EMPTY_INVENTORY);
    const [movements, setMovements] = useState(EMPTY_MOVEMENTS);
    const [purchases, setPurchases] = useState(EMPTY_PURCHASES);

    const [loading, setLoading] = useState({
        warehouses: true,
        sales: true,
        warehouseSales: true,
        inventory: true,
        movements: true,
        purchases: true,
    });

    const [errors, setErrors] = useState({});

    const [refreshKey, setRefreshKey] = useState(0);

    const updateLoading = (key, value) => {
        setLoading((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const updateError = (key, value) => {
        setErrors((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    // ------------------------------------------------
    // COMMON FILTER PARAMS
    // ------------------------------------------------

    const buildParams = useCallback(
        (includeDates = true) => {
            const params = {};

            if (filters.warehouseId) {
                params.warehouseId = filters.warehouseId;
            }

            if (includeDates && filters.startDate) {
                params.startDate = filters.startDate;
            }

            if (includeDates && filters.endDate) {
                params.endDate = filters.endDate;
            }

            return params;
        },
        [filters]
    );

    // ------------------------------------------------
    // WAREHOUSES
    // ------------------------------------------------

    const fetchWarehouses = useCallback(async () => {
        updateLoading("warehouses", true);

        try {
            const response = await api.get("/warehouse", {
                params: { limit: 100 },
            });

            setWarehouses(getArray(response));
            updateError("warehouses", "");
        } catch (error) {
            updateError("warehouses", getErrorMessage(error));
        } finally {
            updateLoading("warehouses", false);
        }
    }, []);

    // ------------------------------------------------
    // SALES SUMMARY
    // GET /api/reports/sales-summary
    // ------------------------------------------------

    const fetchSales = useCallback(async () => {
        updateLoading("sales", true);

        try {
            const response = await api.get("/reports/sales-summary", {
                params: buildParams(true),
            });

            const data = getData(response);

            setSales({
                ...EMPTY_SALES,
                ...data,
                statusCounts: {
                    ...EMPTY_SALES.statusCounts,
                    ...(data.statusCounts || {}),
                },
            });

            updateError("sales", "");
        } catch (error) {
            updateError("sales", getErrorMessage(error));
        } finally {
            updateLoading("sales", false);
        }
    }, [buildParams]);

    // ------------------------------------------------
    // WAREHOUSE SALES
    // GET /api/reports/warehouse-sales
    // ------------------------------------------------

    const fetchWarehouseSales = useCallback(async () => {
        updateLoading("warehouseSales", true);

        try {
            const response = await api.get("/reports/warehouse-sales", {
                params: buildParams(true),
            });

            setWarehouseSales(getArray(response));
            updateError("warehouseSales", "");
        } catch (error) {
            updateError("warehouseSales", getErrorMessage(error));
        } finally {
            updateLoading("warehouseSales", false);
        }
    }, [buildParams]);

    // ------------------------------------------------
    // INVENTORY REPORT
    // GET /api/reports/inventory
    // ------------------------------------------------

    const fetchInventory = useCallback(async () => {
        updateLoading("inventory", true);

        try {
            const response = await api.get("/reports/inventory", {
                params: {
                    ...buildParams(false),
                    ...(lowStockOnly ? { lowStockOnly: "true" } : {}),
                },
            });

            setInventory({
                ...EMPTY_INVENTORY,
                ...getData(response),
            });

            updateError("inventory", "");
        } catch (error) {
            updateError("inventory", getErrorMessage(error));
        } finally {
            updateLoading("inventory", false);
        }
    }, [buildParams, lowStockOnly]);

    // ------------------------------------------------
    // STOCK MOVEMENTS
    // GET /api/reports/stock-movements
    // ------------------------------------------------

    const fetchMovements = useCallback(async () => {
        updateLoading("movements", true);

        try {
            const params = {
                ...buildParams(true),
                ...(movementType ? { type: movementType } : {}),
            };

            const response = await api.get("/reports/stock-movements", {
                params,
            });

            setMovements({
                ...EMPTY_MOVEMENTS,
                ...getData(response),
            });

            updateError("movements", "");
        } catch (error) {
            updateError("movements", getErrorMessage(error));
        } finally {
            updateLoading("movements", false);
        }
    }, [buildParams, movementType]);

    // ------------------------------------------------
    // PURCHASE SUMMARY
    // GET /api/reports/purchases
    // ------------------------------------------------

    const fetchPurchases = useCallback(async () => {
        updateLoading("purchases", true);

        try {
            const params = {
                ...buildParams(true),
                ...(purchaseStatus ? { status: purchaseStatus } : {}),
            };

            const response = await api.get("/reports/purchases", {
                params,
            });

            const data = getData(response);

            setPurchases({
                ...EMPTY_PURCHASES,
                ...data,
                statusCounts: {
                    ...EMPTY_PURCHASES.statusCounts,
                    ...(data.statusCounts || {}),
                },
            });

            updateError("purchases", "");
        } catch (error) {
            updateError("purchases", getErrorMessage(error));
        } finally {
            updateLoading("purchases", false);
        }
    }, [buildParams, purchaseStatus]);

    // ------------------------------------------------
    // INITIAL DATA + FILTER REFRESH
    // ------------------------------------------------

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        fetchSales();
        fetchWarehouseSales();
        fetchInventory();
        fetchMovements();
        fetchPurchases();
    }, [
        fetchSales,
        fetchWarehouseSales,
        fetchInventory,
        fetchMovements,
        fetchPurchases,
        refreshKey,
    ]);

    const refreshAll = () => {
        setRefreshKey((previous) => previous + 1);
    };

    const clearFilters = () => {
        setFilters({
            startDate: "",
            endDate: "",
            warehouseId: "",
        });

        setLowStockOnly(false);
        setMovementType("");
        setPurchaseStatus("");
    };

    // ------------------------------------------------
    // DERIVED DATA
    // ------------------------------------------------

    const inventoryRows = inventory.data || [];
    const movementRows = movements.data || [];
    const purchaseRows = purchases.data || [];

    const salesStatusTotal = Object.values(
        sales.statusCounts || {}
    ).reduce((total, value) => total + Number(value || 0), 0);

    const purchaseStatusTotal = Object.values(
        purchases.statusCounts || {}
    ).reduce((total, value) => total + Number(value || 0), 0);

    const totalWarehouseRevenue = useMemo(
        () =>
            warehouseSales.reduce(
                (total, item) => total + Number(item.totalRevenue || 0),
                0
            ),
        [warehouseSales]
    );

    // ------------------------------------------------
    // CSV EXPORTS
    // ------------------------------------------------

    const exportSales = () => {
        exportCSV("sales-summary.csv", [
            {
                totalOrders: sales.totalOrders,
                draft: sales.statusCounts?.DRAFT,
                confirmed: sales.statusCounts?.CONFIRMED,
                dispatched: sales.statusCounts?.DISPATCHED,
                cancelled: sales.statusCounts?.CANCELLED,
                dispatchedOrders: sales.dispatchedOrders,
                totalRevenue: sales.totalRevenue,
                averageOrderValue: sales.averageOrderValue,
            },
        ]);
    };

    const exportWarehouseSales = () => {
        exportCSV(
            "warehouse-sales.csv",
            warehouseSales.map((item) => ({
                warehouseId: item.warehouseId,
                warehouseName: item.warehouseName,
                location: item.location,
                totalOrders: item.totalOrders,
                dispatchedOrders: item.dispatchedOrders,
                totalRevenue: item.totalRevenue,
            }))
        );
    };

    const exportInventory = () => {
        exportCSV(
            "inventory-report.csv",
            inventoryRows.map((item) => ({
                inventoryId: item.inventoryId,
                productName: item.productName,
                sku: item.sku,
                warehouseName: item.warehouseName,
                location: item.location,
                quantity: item.quantity,
                reorderLevel: item.reorderLevel,
                lowStock: item.lowStock ? "Yes" : "No",
            }))
        );
    };

    const exportMovements = () => {
        exportCSV(
            "stock-movements.csv",
            movementRows.map((item) => ({
                movementId: item.movementId,
                type: item.type,
                productName: item.product?.name,
                sku: item.product?.sku,
                warehouseName: item.warehouse?.name,
                quantity: item.quantity,
                performedBy: item.performedBy?.name,
                note: item.note,
                createdAt: formatDateTime(item.createdAt),
            }))
        );
    };

    const exportPurchases = () => {
        exportCSV(
            "purchase-report.csv",
            purchaseRows.map((item) => ({
                purchaseOrderId: item.purchaseOrderId,
                status: item.status,
                supplier: item.supplier?.name,
                warehouse: item.warehouse?.name,
                totalItems: item.totalItems,
                totalQuantity: item.totalQuantity,
                totalValue: item.totalValue,
                createdAt: formatDate(item.createdAt),
            }))
        );
    };

    // ------------------------------------------------
    // TABS
    // ------------------------------------------------

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "sales", label: "Sales" },
        { id: "inventory", label: "Inventory" },
        { id: "purchases", label: "Purchases" },
        { id: "movements", label: "Stock Movements" },
    ];

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
            {/* ==========================================
          HEADER
      ========================================== */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                            Reports & Analytics
                        </h1>

                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                            REPORTS
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                        Monitor sales, purchases, inventory and warehouse performance.
                    </p>
                </div>

                <button
                    onClick={refreshAll}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-700 sm:self-auto"
                >
                    <span>↻</span>
                    Refresh Reports
                </button>
            </div>

            {/* ==========================================
          GLOBAL FILTERS
      ========================================== */}

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">
                            Report Filters
                        </h2>

                        <p className="mt-0.5 text-[11px] text-gray-500">
                            Select date range and warehouse.
                        </p>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Clear filters
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                            Start Date
                        </label>

                        <input
                            type="date"
                            value={filters.startDate}
                            max={filters.endDate || undefined}
                            onChange={(e) =>
                                setFilters((previous) => ({
                                    ...previous,
                                    startDate: e.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                            End Date
                        </label>

                        <input
                            type="date"
                            value={filters.endDate}
                            min={filters.startDate || undefined}
                            onChange={(e) =>
                                setFilters((previous) => ({
                                    ...previous,
                                    endDate: e.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-medium text-gray-600">
                            Warehouse
                        </label>

                        <select
                            value={filters.warehouseId}
                            onChange={(e) =>
                                setFilters((previous) => ({
                                    ...previous,
                                    warehouseId: e.target.value,
                                }))
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                        >
                            <option value="">All accessible warehouses</option>

                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                    {warehouse.location ? ` - ${warehouse.location}` : ""}
                                </option>
                            ))}
                        </select>

                        {errors.warehouses && (
                            <p className="mt-1 text-[10px] text-amber-600">
                                Warehouse list could not be loaded.
                            </p>
                        )}
                    </div>

                    <div className="flex items-end">
                        <div className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-[10px] font-medium text-gray-500">
                                Active Filters
                            </p>

                            <p className="mt-1 text-xs font-semibold text-gray-800">
                                {
                                    [
                                        filters.startDate,
                                        filters.endDate,
                                        filters.warehouseId,
                                    ].filter(Boolean).length
                                }{" "}
                                applied
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==========================================
          SUMMARY CARDS
      ========================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    title="Total Sales Revenue"
                    value={loading.sales ? "..." : money(sales.totalRevenue)}
                    subtitle={`${number(sales.dispatchedOrders)} dispatched orders`}
                    icon="₹"
                    color="green"
                />

                <SummaryCard
                    title="Total Sales Orders"
                    value={loading.sales ? "..." : number(sales.totalOrders)}
                    subtitle={`${number(sales.statusCounts?.CONFIRMED)} confirmed`}
                    icon="▤"
                    color="blue"
                />

                <SummaryCard
                    title="Inventory Records"
                    value={loading.inventory ? "..." : number(inventory.totalItems)}
                    subtitle="Product-wise warehouse records"
                    icon="▦"
                    color="purple"
                />

                <SummaryCard
                    title="Low Stock Items"
                    value={
                        loading.inventory ? "..." : number(inventory.lowStockItems)
                    }
                    subtitle="At or below reorder level"
                    icon="!"
                    color="orange"
                />
            </div>

            {/* ==========================================
          TABS
      ========================================== */}

            <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${activeTab === tab.id
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==========================================
          OVERVIEW TAB
      ========================================== */}

            {activeTab === "overview" && (
                <div className="space-y-5">
                    {/* Sales + Purchase */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <SectionHeading
                                title="Sales Overview"
                                description="Sales order status distribution"
                                action={
                                    <button
                                        onClick={() => setActiveTab("sales")}
                                        className="text-[11px] font-semibold text-blue-600"
                                    >
                                        View details →
                                    </button>
                                }
                            />

                            {loading.sales ? (
                                <LoadingState />
                            ) : errors.sales ? (
                                <ErrorState message={errors.sales} onRetry={fetchSales} />
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-[11px] text-gray-500">
                                            Average Order Value
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {money(sales.averageOrderValue)}
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-500">
                                            Based on dispatched orders
                                        </p>
                                    </div>

                                    <ProgressBar
                                        label="Draft"
                                        value={sales.statusCounts?.DRAFT}
                                        total={salesStatusTotal}
                                        color="bg-gray-400"
                                    />

                                    <ProgressBar
                                        label="Confirmed"
                                        value={sales.statusCounts?.CONFIRMED}
                                        total={salesStatusTotal}
                                        color="bg-blue-500"
                                    />

                                    <ProgressBar
                                        label="Dispatched"
                                        value={sales.statusCounts?.DISPATCHED}
                                        total={salesStatusTotal}
                                        color="bg-emerald-500"
                                    />

                                    <ProgressBar
                                        label="Cancelled"
                                        value={sales.statusCounts?.CANCELLED}
                                        total={salesStatusTotal}
                                        color="bg-red-500"
                                    />
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border border-gray-200 bg-white p-4">
                            <SectionHeading
                                title="Purchase Overview"
                                description="Purchase order status distribution"
                                action={
                                    <button
                                        onClick={() => setActiveTab("purchases")}
                                        className="text-[11px] font-semibold text-blue-600"
                                    >
                                        View details →
                                    </button>
                                }
                            />

                            {loading.purchases ? (
                                <LoadingState />
                            ) : errors.purchases ? (
                                <ErrorState
                                    message={errors.purchases}
                                    onRetry={fetchPurchases}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-[11px] text-gray-500">
                                            Received Purchase Value
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-gray-900">
                                            {money(purchases.receivedPurchaseValue)}
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-500">
                                            {number(purchases.receivedOrders)} received orders
                                        </p>
                                    </div>

                                    <ProgressBar
                                        label="Draft"
                                        value={purchases.statusCounts?.DRAFT}
                                        total={purchaseStatusTotal}
                                        color="bg-gray-400"
                                    />

                                    <ProgressBar
                                        label="Ordered"
                                        value={purchases.statusCounts?.ORDERED}
                                        total={purchaseStatusTotal}
                                        color="bg-amber-500"
                                    />

                                    <ProgressBar
                                        label="Received"
                                        value={purchases.statusCounts?.RECEIVED}
                                        total={purchaseStatusTotal}
                                        color="bg-emerald-500"
                                    />

                                    <ProgressBar
                                        label="Cancelled"
                                        value={purchases.statusCounts?.CANCELLED}
                                        total={purchaseStatusTotal}
                                        color="bg-red-500"
                                    />
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Warehouse Sales */}
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <SectionHeading
                            title="Warehouse Performance"
                            description="Revenue and dispatched orders by warehouse"
                            action={
                                <ExportButton
                                    onClick={exportWarehouseSales}
                                    disabled={!warehouseSales.length}
                                />
                            }
                        />

                        <ReportTable
                            loading={loading.warehouseSales}
                            error={errors.warehouseSales}
                            retry={fetchWarehouseSales}
                            empty={!warehouseSales.length}
                        >
                            <table className="w-full min-w-[650px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 font-semibold">Location</th>
                                        <th className="px-3 py-3 font-semibold">Total Orders</th>
                                        <th className="px-3 py-3 font-semibold">Dispatched</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {warehouseSales.map((item) => (
                                        <tr
                                            key={item.warehouseId}
                                            className="text-xs transition hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-3 font-semibold text-gray-800">
                                                {item.warehouseName || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-500">
                                                {item.location || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-700">
                                                {number(item.totalOrders)}
                                            </td>

                                            <td className="px-3 py-3 text-gray-700">
                                                {number(item.dispatchedOrders)}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold text-gray-900">
                                                {money(item.totalRevenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot>
                                    <tr className="bg-gray-50 text-xs font-bold text-gray-900">
                                        <td className="px-3 py-3" colSpan={4}>
                                            Total Warehouse Revenue
                                        </td>

                                        <td className="px-3 py-3 text-right">
                                            {money(totalWarehouseRevenue)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </ReportTable>
                    </section>

                    {/* Low Stock */}
                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <SectionHeading
                            title="Low Stock Overview"
                            description="Products at or below their reorder level"
                            action={
                                <button
                                    onClick={() => setActiveTab("inventory")}
                                    className="text-[11px] font-semibold text-blue-600"
                                >
                                    View inventory →
                                </button>
                            }
                        />

                        <ReportTable
                            loading={loading.inventory}
                            error={errors.inventory}
                            retry={fetchInventory}
                            empty={!inventoryRows.some((item) => item.lowStock)}
                        >
                            <table className="w-full min-w-[600px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3 font-semibold">Product</th>
                                        <th className="px-3 py-3 font-semibold">SKU</th>
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Available
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Reorder Level
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {inventoryRows
                                        .filter((item) => item.lowStock)
                                        .slice(0, 5)
                                        .map((item) => (
                                            <tr
                                                key={item.inventoryId}
                                                className="text-xs hover:bg-gray-50"
                                            >
                                                <td className="px-3 py-3 font-semibold text-gray-800">
                                                    {item.productName || "-"}
                                                </td>

                                                <td className="px-3 py-3 text-gray-500">
                                                    {item.sku || "-"}
                                                </td>

                                                <td className="px-3 py-3 text-gray-600">
                                                    {item.warehouseName || "-"}
                                                </td>

                                                <td className="px-3 py-3 text-right font-bold text-red-600">
                                                    {number(item.quantity)}
                                                </td>

                                                <td className="px-3 py-3 text-right text-gray-600">
                                                    {number(item.reorderLevel)}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </ReportTable>
                    </section>
                </div>
            )}

            {/* ==========================================
          SALES TAB
      ========================================== */}

            {activeTab === "sales" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <SummaryCard
                            title="Total Orders"
                            value={loading.sales ? "..." : number(sales.totalOrders)}
                            icon="▤"
                        />

                        <SummaryCard
                            title="Dispatched Orders"
                            value={
                                loading.sales ? "..." : number(sales.dispatchedOrders)
                            }
                            icon="✓"
                            color="green"
                        />

                        <SummaryCard
                            title="Average Order Value"
                            value={
                                loading.sales ? "..." : money(sales.averageOrderValue)
                            }
                            icon="₹"
                            color="purple"
                        />
                    </div>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <SectionHeading
                            title="Sales Summary"
                            description="Order counts and dispatched revenue"
                            action={
                                <ExportButton onClick={exportSales} disabled={loading.sales} />
                            }
                        />

                        {loading.sales ? (
                            <LoadingState />
                        ) : errors.sales ? (
                            <ErrorState message={errors.sales} onRetry={fetchSales} />
                        ) : (
                            <>
                                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {Object.entries(sales.statusCounts || {}).map(
                                        ([status, count]) => (
                                            <div
                                                key={status}
                                                className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                                            >
                                                <StatusBadge status={status} />

                                                <p className="mt-2 text-xl font-bold text-gray-900">
                                                    {number(count)}
                                                </p>

                                                <p className="text-[10px] text-gray-500">Orders</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="rounded-lg bg-emerald-50 p-4">
                                    <p className="text-xs font-medium text-emerald-800">
                                        Total Dispatched Revenue
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-emerald-900">
                                        {money(sales.totalRevenue)}
                                    </p>

                                    <p className="mt-1 text-[10px] text-emerald-700">
                                        Calculated from dispatched sales orders only.
                                    </p>
                                </div>
                            </>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <SectionHeading
                            title="Warehouse Sales"
                            description="Sales performance across accessible warehouses"
                            action={
                                <ExportButton
                                    onClick={exportWarehouseSales}
                                    disabled={!warehouseSales.length}
                                />
                            }
                        />

                        <ReportTable
                            loading={loading.warehouseSales}
                            error={errors.warehouseSales}
                            retry={fetchWarehouseSales}
                            empty={!warehouseSales.length}
                        >
                            <table className="w-full min-w-[650px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase text-gray-500">
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 font-semibold">Location</th>
                                        <th className="px-3 py-3 font-semibold">Orders</th>
                                        <th className="px-3 py-3 font-semibold">Dispatched</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {warehouseSales.map((item) => (
                                        <tr key={item.warehouseId} className="text-xs">
                                            <td className="px-3 py-3 font-semibold text-gray-800">
                                                {item.warehouseName || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-500">
                                                {item.location || "-"}
                                            </td>

                                            <td className="px-3 py-3">
                                                {number(item.totalOrders)}
                                            </td>

                                            <td className="px-3 py-3">
                                                {number(item.dispatchedOrders)}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold">
                                                {money(item.totalRevenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ReportTable>
                    </section>
                </div>
            )}

            {/* ==========================================
          INVENTORY TAB
      ========================================== */}

            {activeTab === "inventory" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <SummaryCard
                            title="Total Inventory Records"
                            value={
                                loading.inventory ? "..." : number(inventory.totalItems)
                            }
                            subtitle="Product-wise warehouse records"
                            icon="▦"
                            color="blue"
                        />

                        <SummaryCard
                            title="Low Stock Records"
                            value={
                                loading.inventory ? "..." : number(inventory.lowStockItems)
                            }
                            subtitle="At or below reorder level"
                            icon="!"
                            color="orange"
                        />
                    </div>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Inventory Details
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Current stock and reorder levels by warehouse.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={lowStockOnly}
                                        onChange={(e) => setLowStockOnly(e.target.checked)}
                                        className="h-3.5 w-3.5 accent-blue-600"
                                    />
                                    Low stock only
                                </label>

                                <ExportButton
                                    onClick={exportInventory}
                                    disabled={!inventoryRows.length}
                                />
                            </div>
                        </div>

                        <ReportTable
                            loading={loading.inventory}
                            error={errors.inventory}
                            retry={fetchInventory}
                            empty={!inventoryRows.length}
                        >
                            <table className="w-full min-w-[750px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3 font-semibold">Product</th>
                                        <th className="px-3 py-3 font-semibold">SKU</th>
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Quantity
                                        </th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Reorder Level
                                        </th>
                                        <th className="px-3 py-3 text-center font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {inventoryRows.map((item) => (
                                        <tr
                                            key={item.inventoryId}
                                            className="text-xs transition hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-3 font-semibold text-gray-800">
                                                {item.productName || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-500">
                                                {item.sku || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-600">
                                                <p className="font-medium text-gray-700">
                                                    {item.warehouseName || "-"}
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-gray-400">
                                                    {item.location || ""}
                                                </p>
                                            </td>

                                            <td
                                                className={`px-3 py-3 text-right font-semibold ${item.lowStock ? "text-red-600" : "text-gray-800"
                                                    }`}
                                            >
                                                {number(item.quantity)}
                                            </td>

                                            <td className="px-3 py-3 text-right text-gray-600">
                                                {number(item.reorderLevel)}
                                            </td>

                                            <td className="px-3 py-3 text-center">
                                                {item.lowStock ? (
                                                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ReportTable>
                    </section>
                </div>
            )}

            {/* ==========================================
          PURCHASES TAB
      ========================================== */}

            {activeTab === "purchases" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <SummaryCard
                            title="Total Purchase Orders"
                            value={
                                loading.purchases ? "..." : number(purchases.totalOrders)
                            }
                            icon="▤"
                        />

                        <SummaryCard
                            title="Received Orders"
                            value={
                                loading.purchases ? "..." : number(purchases.receivedOrders)
                            }
                            icon="✓"
                            color="green"
                        />

                        <SummaryCard
                            title="Received Purchase Value"
                            value={
                                loading.purchases
                                    ? "..."
                                    : money(purchases.receivedPurchaseValue)
                            }
                            icon="₹"
                            color="purple"
                        />
                    </div>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Purchase Orders Report
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Supplier, warehouse and purchase order details.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={purchaseStatus}
                                    onChange={(e) => setPurchaseStatus(e.target.value)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">All statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="ORDERED">Ordered</option>
                                    <option value="RECEIVED">Received</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>

                                <ExportButton
                                    onClick={exportPurchases}
                                    disabled={!purchaseRows.length}
                                />
                            </div>
                        </div>

                        <ReportTable
                            loading={loading.purchases}
                            error={errors.purchases}
                            retry={fetchPurchases}
                            empty={!purchaseRows.length}
                        >
                            <table className="w-full min-w-[850px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3 font-semibold">PO ID</th>
                                        <th className="px-3 py-3 font-semibold">Supplier</th>
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 font-semibold">Items</th>
                                        <th className="px-3 py-3 font-semibold">Total Qty</th>
                                        <th className="px-3 py-3 font-semibold">Status</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Total Value
                                        </th>
                                        <th className="px-3 py-3 font-semibold">Created</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {purchaseRows.map((item) => (
                                        <tr
                                            key={item.purchaseOrderId}
                                            className="text-xs transition hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-3 font-semibold text-gray-900">
                                                #{item.purchaseOrderId}
                                            </td>

                                            <td className="px-3 py-3 font-medium text-gray-700">
                                                {item.supplier?.name || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-600">
                                                {item.warehouse?.name || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-gray-600">
                                                {number(item.totalItems)}
                                            </td>

                                            <td className="px-3 py-3 text-gray-600">
                                                {number(item.totalQuantity)}
                                            </td>

                                            <td className="px-3 py-3">
                                                <StatusBadge status={item.status} />
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold text-gray-900">
                                                {money(item.totalValue)}
                                            </td>

                                            <td className="px-3 py-3 text-gray-500">
                                                {formatDate(item.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ReportTable>
                    </section>
                </div>
            )}

            {/* ==========================================
          STOCK MOVEMENTS TAB
      ========================================== */}

            {activeTab === "movements" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <SummaryCard
                            title="Total Movements"
                            value={
                                loading.movements
                                    ? "..."
                                    : number(movements.totalMovements)
                            }
                            icon="↔"
                        />

                        <SummaryCard
                            title="Stock IN"
                            value={loading.movements ? "..." : number(movements.totalIn)}
                            subtitle="Total incoming quantity"
                            icon="↓"
                            color="green"
                        />

                        <SummaryCard
                            title="Stock OUT"
                            value={loading.movements ? "..." : number(movements.totalOut)}
                            subtitle="Total outgoing quantity"
                            icon="↑"
                            color="orange"
                        />
                    </div>

                    <section className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Stock Movement History
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Track incoming and outgoing stock movements.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={movementType}
                                    onChange={(e) => setMovementType(e.target.value)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                                >
                                    <option value="">All movements</option>
                                    <option value="IN">Stock IN</option>
                                    <option value="OUT">Stock OUT</option>
                                </select>

                                <ExportButton
                                    onClick={exportMovements}
                                    disabled={!movementRows.length}
                                />
                            </div>
                        </div>

                        <ReportTable
                            loading={loading.movements}
                            error={errors.movements}
                            retry={fetchMovements}
                            empty={!movementRows.length}
                        >
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                                        <th className="px-3 py-3 font-semibold">Movement ID</th>
                                        <th className="px-3 py-3 font-semibold">Type</th>
                                        <th className="px-3 py-3 font-semibold">Product</th>
                                        <th className="px-3 py-3 font-semibold">Warehouse</th>
                                        <th className="px-3 py-3 text-right font-semibold">
                                            Quantity
                                        </th>
                                        <th className="px-3 py-3 font-semibold">Performed By</th>
                                        <th className="px-3 py-3 font-semibold">Date</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {movementRows.map((item) => (
                                        <tr
                                            key={item.movementId}
                                            className="text-xs transition hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-3 font-semibold text-gray-900">
                                                #{item.movementId}
                                            </td>

                                            <td className="px-3 py-3">
                                                <StatusBadge status={item.type} />
                                            </td>

                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-gray-800">
                                                    {item.product?.name || "-"}
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-gray-400">
                                                    {item.product?.sku || "-"}
                                                </p>
                                            </td>

                                            <td className="px-3 py-3 text-gray-600">
                                                {item.warehouse?.name || "-"}
                                            </td>

                                            <td className="px-3 py-3 text-right font-semibold text-gray-800">
                                                {number(item.quantity)}
                                            </td>

                                            <td className="px-3 py-3">
                                                <p className="font-medium text-gray-700">
                                                    {item.performedBy?.name || "-"}
                                                </p>

                                                <p className="mt-0.5 text-[10px] text-gray-400">
                                                    {item.performedBy?.email || ""}
                                                </p>
                                            </td>

                                            <td className="px-3 py-3 text-gray-500">
                                                {formatDateTime(item.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </ReportTable>
                    </section>
                </div>
            )}

            {/* ==========================================
          FOOTER
      ========================================== */}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4">
                <p className="text-[10px] text-gray-400">
                    Reports are generated using your accessible warehouse data.
                </p>

                <p className="text-[10px] text-gray-400">
                    StockPilot · Reports & Analytics
                </p>
            </div>
        </div>
    );
}

// ==================================================
// PROTECTED PAGE
// ==================================================

export default function ReportsPage() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <ReportsContent />
        </AuthGuard>
    );
}