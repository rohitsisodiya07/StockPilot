"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import PrintableDocumentModal from "@/components/documents/PrintableDocumentModal";
import {
    Receipt,
    Search,
    RefreshCw,
    AlertTriangle,
    Eye,
    Calendar,
    PackageCheck,
    CheckCircle2,
    Clock,
    XCircle,
    User,
} from "lucide-react";

export default function WarehouseSalesOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [error, setError] = useState("");

    // Details Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [printDoc, setPrintDoc] = useState(null);

    const loadWarehouses = useCallback(async () => {
        try {
            const userStr = sessionStorage.getItem("stockpilot_user");
            if (!userStr) return;
            const user = JSON.parse(userStr);

            const res = await api.get(`/userWarehouse/user/${user.id}`);
            const assignments = res.data?.data || [];
            const mapped = assignments.map((a) => a.warehouse || a).filter(Boolean);
            setWarehouses(mapped);

            if (mapped.length > 0) {
                setSelectedWarehouseId(String(mapped[0].id));
            }
        } catch (err) {
            console.error("Error loading warehouses:", err);
            setError("Failed to load assigned warehouses.");
        }
    }, []);

    const loadSalesOrders = useCallback(async (warehouseId, isRefresh = false) => {
        if (!warehouseId) {
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            setError("");
            const res = await api.get(`/salesOrder?warehouseId=${warehouseId}&limit=50`);
            const data = res.data?.data || res.data?.data?.data || [];
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading sales orders:", err);
            setError(err.response?.data?.message || "Failed to load outbound orders.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadWarehouses();
    }, [loadWarehouses]);

    useEffect(() => {
        if (selectedWarehouseId) {
            loadSalesOrders(selectedWarehouseId);
        }
    }, [selectedWarehouseId, loadSalesOrders]);

    const viewOrderDetails = async (order) => {
        setActiveOrder(order);
        setModalOpen(true);
        try {
            const res = await api.get(`/salesOrder/${order.id}`);
            if (res.data?.data) {
                setActiveOrder(res.data.data);
            }
        } catch (err) {
            console.warn("Could not fetch full SO items, using list data:", err);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const customerName = order.customerName?.toLowerCase() || "";
            const soId = String(order.id);
            const matchesSearch = customerName.includes(search.toLowerCase()) || soId.includes(search);

            if (!matchesSearch) return false;
            if (statusFilter !== "ALL" && order.status !== statusFilter) return false;

            return true;
        });
    }, [orders, search, statusFilter]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "DISPATCHED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <PackageCheck className="h-3 w-3" /> Dispatched
                    </span>
                );
            case "CONFIRMED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                        <Clock className="h-3 w-3" /> Ready to Pick
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                        <XCircle className="h-3 w-3" /> Cancelled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                        Draft
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Outbound Orders (Sales Orders)
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Inspect pick lists, prepare customer dispatches, and check packed items.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {warehouses.length > 1 && (
                        <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs outline-none cursor-pointer focus:border-emerald-500"
                        >
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        type="button"
                        onClick={() => loadSalesOrders(selectedWarehouseId, true)}
                        disabled={refreshing || !selectedWarehouseId}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search SO # or customer name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { id: "ALL", label: "All Orders" },
                        { id: "CONFIRMED", label: "Ready to Pick" },
                        { id: "DISPATCHED", label: "Dispatched" },
                        { id: "DRAFT", label: "Draft" },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setStatusFilter(btn.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                statusFilter === btn.id
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Order #</th>
                                <th className="py-3.5 px-4">Customer</th>
                                <th className="py-3.5 px-4">Order Date</th>
                                <th className="py-3.5 px-4 text-center">Items to Pick</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Pick List</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Loading outbound orders...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Sales Orders Found</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            No outbound customer orders matching your criteria.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((so) => (
                                    <tr key={so.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                                            #{so.id}
                                        </td>

                                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                                            <p>{so.customerName || "Customer"}</p>
                                            <p className="text-[10px] text-slate-400">{so.customerEmail || ""}</p>
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                                            {so.createdAt
                                                ? new Date(so.createdAt).toLocaleDateString("en-IN", {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                  })
                                                : "-"}
                                        </td>

                                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                                            {so.items?.length ?? "-"}
                                        </td>

                                        <td className="py-3.5 px-4 text-center">
                                            {getStatusBadge(so.status)}
                                        </td>

                                        <td className="py-3.5 px-4 sm:px-6 text-right">
                                            <button
                                                type="button"
                                                onClick={() => viewOrderDetails(so)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-slate-500" />
                                                <span>Pick List</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
                    Showing <b>{filteredOrders.length}</b> orders
                </div>
            </div>

            {/* Pick List Modal */}
            {modalOpen && activeOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Pick List for Order #{activeOrder.id}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Customer: <b>{activeOrder.customerName}</b> • Status: <b>{activeOrder.status}</b>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4 flex-1 overflow-y-auto space-y-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Items to Pick & Pack
                            </h4>

                            {!activeOrder.items || activeOrder.items.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-4 text-center">
                                    No items listed for this order.
                                </p>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                            <tr>
                                                <th className="py-2.5 px-3">Product Name</th>
                                                <th className="py-2.5 px-3">SKU</th>
                                                <th className="py-2.5 px-3 text-right">Qty to Pick</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeOrder.items.map((item, idx) => (
                                                <tr key={item.id || idx}>
                                                    <td className="py-2.5 px-3 font-medium text-slate-800">
                                                        {item.product?.name || `Product #${item.productId}`}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-mono text-slate-500">
                                                        {item.product?.sku || "-"}
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 text-sm">
                                                        {item.quantity} units
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPrintDoc({ type: "PACKING_SLIP", order: activeOrder })}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                            >
                                📦 Print Packing Slip
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrintDoc({ type: "INVOICE", order: activeOrder })}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition"
                            >
                                🖨️ Print Invoice
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Document Modal */}
            <PrintableDocumentModal
                isOpen={Boolean(printDoc)}
                onClose={() => setPrintDoc(null)}
                type={printDoc?.type}
                order={printDoc?.order}
            />
        </div>
    );
}
