"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
    RotateCcw,
    Plus,
    CheckCircle2,
    AlertTriangle,
    Trash2,
    RefreshCw,
    X,
    Warehouse,
    Package,
    Search,
    Filter,
} from "lucide-react";

export default function WarehouseReturnsPage() {
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [conditionFilter, setConditionFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [refNumber, setRefNumber] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedWhId, setSelectedWhId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [condition, setCondition] = useState("GOOD");
    const [action, setAction] = useState("RESTOCK");
    const [reason, setReason] = useState("Customer changed mind");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchInspections = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        try {
            const condParam = conditionFilter !== "ALL" ? `&condition=${conditionFilter}` : "";
            const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
            const res = await api.get(`/warehouse/return-inspections?limit=50${condParam}${searchParam}`);
            if (res.data?.success) {
                setInspections(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load return inspections:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load inspections");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [conditionFilter, searchTerm]);

    useEffect(() => {
        fetchInspections();
    }, [fetchInspections]);

    // Load products & warehouses for the modal
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
                if (whList.length > 0) setSelectedWhId(String(whList[0].id));
            } catch (err) {
                console.error("Failed to load modal data:", err);
            }
        };
        loadFormData();
    }, []);

    // Auto-update action based on condition
    const handleConditionChange = (newCond) => {
        setCondition(newCond);
        if (newCond === "DAMAGED") {
            setAction("SCRAP");
            setReason("Defective / Damaged in transit");
        } else {
            setAction("RESTOCK");
            setReason("Resellable / Package intact");
        }
    };

    const handleCreateInspection = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!refNumber.trim() || !selectedProductId || !selectedWhId || !quantity) {
            setErrorMsg("Please fill in all required fields");
            return;
        }

        try {
            setSubmitting(true);
            const res = await api.post("/warehouse/return-inspections", {
                referenceNumber: refNumber.trim(),
                customerName: customerName.trim() || undefined,
                productId: Number(selectedProductId),
                warehouseId: Number(selectedWhId),
                quantity: Number(quantity),
                condition,
                action,
                reason,
                notes: notes.trim() || undefined,
            });

            if (res.data?.success) {
                setSuccessMsg(res.data.message || "Inspection logged successfully!");
                setModalOpen(false);
                setRefNumber("");
                setCustomerName("");
                setQuantity("1");
                setNotes("");
                fetchInspections(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to log return inspection");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <RotateCcw className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        Customer Return Inspection (RMA)
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Inspect returned packages on the floor, determine resale or scrap status, and automatically restock good items.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchInspections(true)}
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
                        Log Return Inspection
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

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    {["ALL", "GOOD", "DAMAGED"].map((cond) => (
                        <button
                            key={cond}
                            type="button"
                            onClick={() => setConditionFilter(cond)}
                            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                                conditionFilter === cond
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            {cond === "ALL" ? "All Conditions" : cond === "GOOD" ? "Good (Resellable)" : "Damaged (Scrap)"}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search ref # or customer..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden"
                    />
                </div>
            </div>

            {/* Inspections Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs">Loading return inspections...</p>
                    </div>
                ) : inspections.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No customer return inspections recorded.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Ref #</th>
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Product</th>
                                    <th className="py-3 px-4">Warehouse</th>
                                    <th className="py-3 px-4">Qty</th>
                                    <th className="py-3 px-4">Condition</th>
                                    <th className="py-3 px-4">Action Taken</th>
                                    <th className="py-3 px-4">Reason / Notes</th>
                                    <th className="py-3 px-4">Inspected By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {inspections.map((insp) => (
                                    <tr key={insp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                            #{insp.referenceNumber}
                                        </td>
                                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                            {insp.customerName || "Customer"}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-slate-800 dark:text-slate-200">
                                                {insp.product?.name || "Product"}
                                            </p>
                                            <p className="text-[10px] text-slate-400">{insp.product?.sku}</p>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">
                                            {insp.warehouse?.name || "Floor"}
                                        </td>
                                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                                            {insp.quantity} units
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                    insp.condition === "GOOD"
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                                                }`}
                                            >
                                                {insp.condition === "GOOD" ? "✓ Good / Intact" : "⚠ Damaged"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                    insp.action === "RESTOCK"
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                                }`}
                                            >
                                                {insp.action === "RESTOCK" ? "Restocked to Inventory" : "Scrap / Write-off"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                            {insp.reason || insp.notes || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-[11px] text-slate-400">
                                            {insp.inspector?.name || "Staff"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <form
                        onSubmit={handleCreateInspection}
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <RotateCcw className="h-5 w-5 text-emerald-600" />
                                Inspect Return Item (RMA)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Return / Order Ref # *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                    placeholder="e.g. RMA-2045 or SO-12"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Customer Name
                                </label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Product Returned *
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
                                    Warehouse Floor *
                                </label>
                                <select
                                    required
                                    value={selectedWhId}
                                    onChange={(e) => setSelectedWhId(e.target.value)}
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
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Physical Condition
                                </label>
                                <select
                                    value={condition}
                                    onChange={(e) => handleConditionChange(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    <option value="GOOD">Good / Resellable</option>
                                    <option value="DAMAGED">Damaged / Broken</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Action
                                </label>
                                <select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    <option value="RESTOCK">Restock into Inventory</option>
                                    <option value="SCRAP">Scrap / Write-off</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Reason
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Wrong color received / Customer changed mind"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Staff Notes
                            </label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Seal opened but product untested and in brand new condition..."
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
                                {submitting ? "Logging..." : "Confirm Inspection"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
