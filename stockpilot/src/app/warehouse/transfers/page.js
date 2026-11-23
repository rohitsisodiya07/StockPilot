"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
    ArrowLeftRight,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    X,
    Warehouse,
    Package,
    Check,
} from "lucide-react";

export default function WarehouseTransfersPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [fromWarehouseId, setFromWarehouseId] = useState("");
    const [toWarehouseId, setToWarehouseId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [priority, setPriority] = useState("NORMAL");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchTransferRequests = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        try {
            const statusParam = statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
            const res = await api.get(`/warehouse/transfer-requests?limit=50${statusParam}`);
            if (res.data?.success) {
                setRequests(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load transfer requests:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load transfer requests");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchTransferRequests();
    }, [fetchTransferRequests]);

    // Load products & warehouses for the request modal
    useEffect(() => {
        const loadFormData = async () => {
            try {
                const [prodRes, whRes] = await Promise.all([
                    api.get("/product?limit=100"),
                    api.get("/warehouse?limit=50"),
                ]);

                const prodList = prodRes.data?.data || prodRes.data?.products || [];
                const whList = whRes.data?.data || whRes.data?.warehouses || [];

                setProducts(prodList);
                setWarehouses(whList);

                if (prodList.length > 0) setSelectedProductId(String(prodList[0].id));
                if (whList.length > 0) {
                    setFromWarehouseId(String(whList[0].id));
                    if (whList.length > 1) setToWarehouseId(String(whList[1].id));
                    else setToWarehouseId(String(whList[0].id));
                }
            } catch (err) {
                console.error("Failed to load modal data:", err);
            }
        };
        loadFormData();
    }, []);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!selectedProductId || !fromWarehouseId || !toWarehouseId || !quantity) {
            setErrorMsg("Please fill in all required fields");
            return;
        }

        if (fromWarehouseId === toWarehouseId) {
            setErrorMsg("Source and destination warehouses cannot be the same");
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post("/warehouse/transfer-requests", {
                productId: Number(selectedProductId),
                fromWarehouseId: Number(fromWarehouseId),
                toWarehouseId: Number(toWarehouseId),
                quantity: Number(quantity),
                priority,
                reason: reason.trim() || undefined,
            });

            if (res.data?.success) {
                setSuccessMsg("Transfer request submitted successfully!");
                setModalOpen(false);
                setQuantity("");
                setReason("");
                fetchTransferRequests(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFulfillRequest = async (id) => {
        try {
            setActionLoading(true);
            setErrorMsg("");
            const res = await api.patch(`/warehouse/transfer-requests/${id}`, {
                status: "COMPLETED",
                reviewNotes: "Fulfilled & stock transferred by warehouse staff",
            });
            if (res.data?.success) {
                setSuccessMsg("Stock transfer executed and completed!");
                fetchTransferRequests(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to complete transfer");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "COMPLETED":
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
            case "APPROVED":
                return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "REJECTED":
                return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800";
            default:
                return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <ArrowLeftRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        Stock Transfer Requests
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Request stock transfers between warehouses, track approval status, and confirm floor arrivals.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchTransferRequests(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                    >
                        <Plus className="h-4 w-4" />
                        Raise Transfer Request
                    </button>
                </div>
            </div>

            {/* Alert Messages */}
            {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")}><X className="h-4 w-4" /></button>
                </div>
            )}
            {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {["ALL", "PENDING", "APPROVED", "COMPLETED", "REJECTED"].map((st) => (
                    <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                            statusFilter === st
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* Requests Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs">Loading transfer requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No transfer requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Req #</th>
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4">From ➔ To Warehouse</th>
                                    <th className="py-3 px-4">Quantity</th>
                                    <th className="py-3 px-4">Priority</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Reason / Notes</th>
                                    <th className="py-3 px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                            #TR-{String(req.id).padStart(4, "0")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">
                                                {req.product?.name || "Product"}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{req.product?.sku}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    {req.fromWarehouse?.name || `WH-${req.fromWarehouseId}`}
                                                </span>
                                                <span className="text-slate-400">➔</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {req.toWarehouse?.name || `WH-${req.toWarehouseId}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                                            {req.quantity} units
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-bold text-[10px] uppercase">
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                                                    req.status
                                                )}`}
                                            >
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                            {req.reason || req.reviewNotes || "—"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {req.status === "APPROVED" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleFulfillRequest(req.id)}
                                                    disabled={actionLoading}
                                                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Fulfill & Move
                                                </button>
                                            )}
                                            {req.status === "COMPLETED" && (
                                                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Transferred
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Raise Request Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <form
                        onSubmit={handleCreateRequest}
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                                Raise Stock Transfer Request
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Product *
                            </label>
                            <select
                                required
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            >
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.sku})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    From (Source WH) *
                                </label>
                                <select
                                    required
                                    value={fromWarehouseId}
                                    onChange={(e) => setFromWarehouseId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    To (Target WH) *
                                </label>
                                <select
                                    required
                                    value={toWarehouseId}
                                    onChange={(e) => setToWarehouseId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="e.g. 50"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Reason / Justification
                            </label>
                            <textarea
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Running out of stock for pending SO #45..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            >
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
