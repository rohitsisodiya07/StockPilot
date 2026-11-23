"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
    Boxes,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Warehouse,
    Activity,
    Package,
    RefreshCw,
    TrendingDown,
    Plus,
    Minus,
    CheckSquare,
    Clock,
    ArrowLeftRight,
    RotateCcw,
    History,
} from "lucide-react";

export default function WarehouseDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState("");

    // Quick Movement Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [movementType, setMovementType] = useState("IN");
    const [warehouseInventory, setWarehouseInventory] = useState([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState("");
    const [movementQty, setMovementQty] = useState("");
    const [movementNote, setMovementNote] = useState("");
    const [submittingMovement, setSubmittingMovement] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    // Fetch user and assigned warehouses
    const loadInitialData = useCallback(async () => {
        try {
            setError("");
            const userStr = sessionStorage.getItem("stockpilot_user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            // Fetch user's assigned warehouses
            const response = await api.get(`/userWarehouse/user/${user.id}`);
            const assignments = response.data?.data || [];
            const mappedWarehouses = assignments
                .map((a) => a.warehouse || a)
                .filter(Boolean);

            setWarehouses(mappedWarehouses);

            if (mappedWarehouses.length > 0) {
                const defaultId = mappedWarehouses[0].id;
                setSelectedWarehouseId(String(defaultId));
            }
        } catch (err) {
            console.error("Failed to load warehouses:", err);
            setError(err.response?.data?.message || "Failed to load assigned warehouses.");
        }
    }, []);

    const loadDashboardData = useCallback(async (warehouseId, isRefresh = false) => {
        if (!warehouseId) {
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            setError("");
            const refreshParam = isRefresh ? "&refresh=true" : "";

            // Parallelize dashboard and inventory requests with Promise.all
            const [res, invRes] = await Promise.all([
                api.get(`/dashboard?warehouseId=${warehouseId}&limit=8${refreshParam}`),
                api.get(`/inventory/warehouse/${warehouseId}`),
            ]);

            if (res.data?.success) {
                setAnalytics(res.data.data);
            }

            const invData = invRes.data?.data || invRes.data || [];
            setWarehouseInventory(Array.isArray(invData) ? invData : []);
        } catch (err) {
            console.error("Dashboard data load error:", err);
            setError(err.response?.data?.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const initialLoadedRef = useRef(false);
    useEffect(() => {
        if (!initialLoadedRef.current) {
            initialLoadedRef.current = true;
            loadInitialData();
        }
    }, [loadInitialData]);

    useEffect(() => {
        if (selectedWarehouseId) {
            loadDashboardData(selectedWarehouseId);
        }
    }, [selectedWarehouseId, loadDashboardData]);

    const handleQuickMovementSubmit = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalSuccess("");

        const qtyNum = Number(movementQty);
        if (!selectedInventoryId) {
            setModalError("Please select a product");
            return;
        }
        if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
            setModalError("Quantity must be a positive whole number");
            return;
        }

        setSubmittingMovement(true);
        try {
            await api.post("/stockMovement", {
                inventoryId: Number(selectedInventoryId),
                type: movementType,
                quantity: qtyNum,
                note: movementNote.trim() || `Floor Quick ${movementType}`,
            });

            setModalSuccess(`Successfully recorded ${movementType} of ${qtyNum} units.`);
            setMovementQty("");
            setMovementNote("");

            // Reload dashboard metrics
            await loadDashboardData(selectedWarehouseId, true);

            setTimeout(() => {
                setModalOpen(false);
                setModalSuccess("");
            }, 1200);
        } catch (err) {
            console.error("Quick movement error:", err);
            setModalError(err.response?.data?.message || "Failed to record movement.");
        } finally {
            setSubmittingMovement(false);
        }
    };

    const openQuickMove = (type) => {
        setMovementType(type);
        setModalError("");
        setModalSuccess("");
        setMovementQty("");
        setMovementNote("");
        if (warehouseInventory.length > 0 && !selectedInventoryId) {
            setSelectedInventoryId(String(warehouseInventory[0].id));
        }
        setModalOpen(true);
    };

    const activeWarehouse = warehouses.find(
        (w) => String(w.id) === String(selectedWarehouseId)
    );

    return (
        <div className="space-y-6">
            {/* Top Banner / Warehouse Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-emerald-200 uppercase">
                            Floor Operations
                        </span>
                    </div>
                    <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                        Warehouse Staff Overview
                    </h1>
                    <p className="mt-1 text-sm text-emerald-100/80">
                        Real-time stock levels, rapid logging, and low stock alerts for your assigned floor.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Warehouse dropdown */}
                    {warehouses.length > 1 ? (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20">
                            <label className="block px-2 pt-1 text-[10px] font-medium text-emerald-200">
                                Assigned Warehouse
                            </label>
                            <select
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                className="bg-transparent text-white text-sm font-semibold px-2 py-1 outline-none cursor-pointer"
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id} className="text-slate-900">
                                        {w.name} ({w.location || "Main"})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : activeWarehouse ? (
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20">
                            <Warehouse className="h-5 w-5 text-emerald-300" />
                            <div>
                                <p className="text-xs font-medium text-emerald-200">Assigned Facility</p>
                                <p className="text-sm font-bold text-white">{activeWarehouse.name}</p>
                            </div>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => loadDashboardData(selectedWarehouseId, true)}
                        disabled={refreshing || !selectedWarehouseId}
                        className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 transition disabled:opacity-50"
                        title="Refresh metrics"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            {warehouses.length === 0 && !loading && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
                    <Warehouse className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                    <h3 className="text-base font-bold text-amber-900">No Warehouse Assigned Yet</h3>
                    <p className="mt-1 text-sm text-amber-700 max-w-md mx-auto">
                        Your account hasn't been assigned to a warehouse yet. Please ask your Inventory Manager or Administrator to link you to a warehouse floor.
                    </p>
                </div>
            )}

            {/* Quick Action Floor Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => openQuickMove("IN")}
                    disabled={!selectedWarehouseId || warehouseInventory.length === 0}
                    className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition shadow-xs text-left group disabled:opacity-50 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Quick Stock IN</h4>
                            <p className="text-xs text-slate-500">Record incoming stock</p>
                        </div>
                    </div>
                    <ArrowDownRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                    type="button"
                    onClick={() => openQuickMove("OUT")}
                    disabled={!selectedWarehouseId || warehouseInventory.length === 0}
                    className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 transition shadow-xs text-left group disabled:opacity-50 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                            <Minus className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Quick Stock OUT</h4>
                            <p className="text-xs text-slate-500">Dispatch / adjust floor stock</p>
                        </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-rose-600 group-hover:translate-x-0.5 transition" />
                </button>

                <Link
                    href="/warehouse/inventory"
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-xs text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Browse Full Inventory</h4>
                            <p className="text-xs text-slate-500">Inspect all SKUs & reorder levels</p>
                        </div>
                    </div>
                    <span className="text-slate-400 group-hover:text-slate-700 transition">→</span>
                </Link>
            </div>

            {/* Staff Operational Workflow Hub */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Staff Ground Operations Hub
                    </h3>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Floor Actions
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Link
                        href="/warehouse/tasks"
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex flex-col gap-2"
                    >
                        <CheckSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">My Tasks</p>
                            <p className="text-[10px] text-slate-500">Assigned duties</p>
                        </div>
                    </Link>

                    <Link
                        href="/warehouse/shifts"
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex flex-col gap-2"
                    >
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Shift & Clock-in</p>
                            <p className="text-[10px] text-slate-500">Daily attendance</p>
                        </div>
                    </Link>

                    <Link
                        href="/warehouse/transfers"
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex flex-col gap-2"
                    >
                        <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Transfer Request</p>
                            <p className="text-[10px] text-slate-500">Move stock</p>
                        </div>
                    </Link>

                    <Link
                        href="/warehouse/returns"
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex flex-col gap-2"
                    >
                        <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Return Inspection</p>
                            <p className="text-[10px] text-slate-500">RMA restock/scrap</p>
                        </div>
                    </Link>

                    <Link
                        href="/warehouse/activity"
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex flex-col gap-2"
                    >
                        <History className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">My Activity</p>
                            <p className="text-[10px] text-slate-500">Operations log</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Units In Stock
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Boxes className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {loading ? "..." : Number(analytics?.metrics?.totalInventoryUnits || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Total units on facility shelves</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Low Stock Items
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600">
                        {loading ? "..." : analytics?.metrics?.lowStockCount ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Need replenishment</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Tracked Products
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Package className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {loading ? "..." : analytics?.metrics?.totalProducts ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Distinct catalog items</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Movements Logged
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Activity className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {loading ? "..." : analytics?.stockMovements?.pagination?.total ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Total movement audit entries</p>
                </div>
            </div>

            {/* Split Section: Low Stock Warning + Recent Movements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items List */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-amber-500" />
                            <h3 className="text-sm font-bold text-slate-800">
                                Low Stock Alerts
                            </h3>
                        </div>
                        <Link
                            href="/warehouse/inventory"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-slate-400">Loading alerts...</div>
                        ) : !analytics?.lowStockProducts || analytics.lowStockProducts.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                                    ✓
                                </div>
                                <p className="text-sm font-medium text-slate-700">Healthy Stock Levels</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    No products are currently under reorder thresholds.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                                            <th className="pb-3">Product</th>
                                            <th className="pb-3 text-center">Available</th>
                                            <th className="pb-3 text-center">Reorder Level</th>
                                            <th className="pb-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {analytics.lowStockProducts.map((item, idx) => {
                                            const qty = Number(item.quantity || 0);
                                            const reorder = Number(item.reorderLevel || 10);
                                            const isOut = qty <= 0;
                                            return (
                                                <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                                    <td className="py-3 font-medium text-slate-800">
                                                        <p className="truncate max-w-[180px]">
                                                            {item.product?.name || item.productName || "Product"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            SKU: {item.product?.sku || item.sku || "-"}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 text-center font-bold text-slate-900">
                                                        {qty}
                                                    </td>
                                                    <td className="py-3 text-center text-slate-500">
                                                        {reorder}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                                                isOut
                                                                    ? "bg-red-50 text-red-700 border-red-200"
                                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                                            }`}
                                                        >
                                                            {isOut ? "Out of Stock" : "Low Stock"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Movement History */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:px-6">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-sm font-bold text-slate-800">
                                Recent Floor Movements
                            </h3>
                        </div>
                        <Link
                            href="/warehouse/stock-movement"
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            Full History
                        </Link>
                    </div>

                    <div className="p-4 sm:p-6">
                        {loading ? (
                            <div className="py-8 text-center text-sm text-slate-400">Loading activity...</div>
                        ) : !analytics?.stockMovements?.items || analytics.stockMovements.items.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">
                                No movements recorded yet for this facility.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analytics.stockMovements.items.slice(0, 6).map((mov) => {
                                    const isIn = mov.type === "IN";
                                    return (
                                        <div
                                            key={mov.id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/40"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                        isIn
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-rose-100 text-rose-700"
                                                    }`}
                                                >
                                                    {isIn ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px] sm:max-w-[220px]">
                                                        {mov.inventory?.product?.name || mov.productName || "Stock Item"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {mov.note || (isIn ? "Stock Inward" : "Stock Outward")} • By {mov.user?.name || "Staff"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p
                                                    className={`text-xs font-bold ${
                                                        isIn ? "text-emerald-600" : "text-rose-600"
                                                    }`}
                                                >
                                                    {isIn ? "+" : "-"}{mov.quantity} units
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {mov.createdAt
                                                        ? new Date(mov.createdAt).toLocaleDateString("en-IN", {
                                                              month: "short",
                                                              day: "numeric",
                                                          })
                                                        : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Movement Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-white ${
                                        movementType === "IN" ? "bg-emerald-600" : "bg-rose-600"
                                    }`}
                                >
                                    {movementType === "IN" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Quick Stock {movementType}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition"
                            >
                                ✕
                            </button>
                        </div>

                        {modalError && (
                            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                                {modalError}
                            </div>
                        )}

                        {modalSuccess && (
                            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                                {modalSuccess}
                            </div>
                        )}

                        <form onSubmit={handleQuickMovementSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Select Product
                                </label>
                                <select
                                    value={selectedInventoryId}
                                    onChange={(e) => setSelectedInventoryId(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                                >
                                    {warehouseInventory.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.product?.name || `Product #${item.productId}`} (Current Stock: {item.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Quantity ({movementType === "IN" ? "Receiving" : "Dispatching"})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Enter quantity"
                                    value={movementQty}
                                    onChange={(e) => setMovementQty(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Reason / Floor Note
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Delivery arrival, damaged goods, floor adjustment"
                                    value={movementNote}
                                    onChange={(e) => setMovementNote(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submittingMovement}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingMovement}
                                    className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-60 ${
                                        movementType === "IN"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-rose-600 hover:bg-rose-700"
                                    }`}
                                >
                                    {submittingMovement ? "Recording..." : `Confirm Stock ${movementType}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
