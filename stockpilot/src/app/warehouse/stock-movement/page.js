"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
    Activity,
    Plus,
    Minus,
    Search,
    RefreshCw,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    Warehouse,
    Filter,
} from "lucide-react";

export default function WarehouseStockMovementPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [movements, setMovements] = useState([]);
    const [inventoryOptions, setInventoryOptions] = useState([]);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("ALL"); // ALL, IN, OUT
    const [error, setError] = useState("");

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState("");
    const [movementType, setMovementType] = useState("IN");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

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

    const loadMovementsData = useCallback(async (warehouseId, isRefresh = false) => {
        if (!warehouseId) {
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            setError("");
            // Use dashboard endpoint with limit=50 to fetch movements
            const res = await api.get(`/dashboard?warehouseId=${warehouseId}&limit=50`);
            const data = res.data?.data?.stockMovements?.items || [];
            setMovements(Array.isArray(data) ? data : []);

            // Also load inventory for dropdown
            const invRes = await api.get(`/inventory/warehouse/${warehouseId}`);
            const invList = invRes.data?.data || invRes.data || [];
            setInventoryOptions(Array.isArray(invList) ? invList : []);
        } catch (err) {
            console.error("Error loading movements:", err);
            setError(err.response?.data?.message || "Failed to load movements log.");
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
            loadMovementsData(selectedWarehouseId);
        }
    }, [selectedWarehouseId, loadMovementsData]);

    const handleCreateMovement = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalSuccess("");

        const qtyNum = Number(quantity);
        if (!selectedInventoryId) {
            setModalError("Please select a valid item.");
            return;
        }
        if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
            setModalError("Quantity must be a positive integer.");
            return;
        }

        const selectedInv = inventoryOptions.find((i) => String(i.id) === String(selectedInventoryId));
        if (movementType === "OUT" && selectedInv && qtyNum > Number(selectedInv.quantity)) {
            setModalError(`Cannot deduct ${qtyNum} units. Current stock is ${selectedInv.quantity}.`);
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/stockMovement", {
                inventoryId: Number(selectedInventoryId),
                type: movementType,
                quantity: qtyNum,
                note: note.trim() || `Floor Movement ${movementType}`,
            });

            setModalSuccess(`Successfully logged ${movementType} of ${qtyNum} units.`);
            await loadMovementsData(selectedWarehouseId, true);

            setTimeout(() => {
                setModalOpen(false);
                setQuantity("");
                setNote("");
                setModalSuccess("");
            }, 1000);
        } catch (err) {
            console.error("Movement logging error:", err);
            setModalError(err.response?.data?.message || "Failed to log movement.");
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = (type = "IN") => {
        setMovementType(type);
        setModalError("");
        setModalSuccess("");
        setQuantity("");
        setNote("");
        if (inventoryOptions.length > 0 && !selectedInventoryId) {
            setSelectedInventoryId(String(inventoryOptions[0].id));
        }
        setModalOpen(true);
    };

    const filteredMovements = useMemo(() => {
        return movements.filter((mov) => {
            const prodName = mov.inventory?.product?.name?.toLowerCase() || mov.productName?.toLowerCase() || "";
            const noteText = mov.note?.toLowerCase() || "";
            const matchesSearch = prodName.includes(search.toLowerCase()) || noteText.includes(search.toLowerCase());

            if (!matchesSearch) return false;
            if (filterType !== "ALL" && mov.type !== filterType) return false;

            return true;
        });
    }, [movements, search, filterType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Stock Movements & Floor Logs
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Audit trail of every stock increase, deduction, and floor adjustment.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                        onClick={() => loadMovementsData(selectedWarehouseId, true)}
                        disabled={refreshing || !selectedWarehouseId}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => openModal("IN")}
                        disabled={inventoryOptions.length === 0}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Log Movement</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search product name or floor note..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                </div>

                <div className="flex items-center gap-1.5">
                    {[
                        { id: "ALL", label: "All Types" },
                        { id: "IN", label: "Inward (+)" },
                        { id: "OUT", label: "Outward (-)" },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setFilterType(btn.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                filterType === btn.id
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table of Movements */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Type</th>
                                <th className="py-3.5 px-4">Product Name</th>
                                <th className="py-3.5 px-4 text-center">Quantity</th>
                                <th className="py-3.5 px-4">Reason / Note</th>
                                <th className="py-3.5 px-4">Operator</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Loading movement audit logs...
                                    </td>
                                </tr>
                            ) : filteredMovements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Activity className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Movement Records Found</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Log incoming or outgoing stock to see records here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMovements.map((mov) => {
                                    const isIn = mov.type === "IN";
                                    return (
                                        <tr key={mov.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3.5 px-4 sm:px-6">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                                                        isIn
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border-rose-200"
                                                    }`}
                                                >
                                                    {isIn ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                    {mov.type}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                                                <p className="truncate max-w-xs">
                                                    {mov.inventory?.product?.name || mov.productName || "Stock Product"}
                                                </p>
                                                {mov.inventory?.product?.sku && (
                                                    <p className="font-mono text-[10px] text-slate-400">
                                                        SKU: {mov.inventory.product.sku}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`text-sm font-extrabold ${
                                                        isIn ? "text-emerald-700" : "text-rose-700"
                                                    }`}
                                                >
                                                    {isIn ? "+" : "-"}{mov.quantity}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                                                {mov.note || "-"}
                                            </td>

                                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                                                {mov.user?.name || "Staff Member"}
                                            </td>

                                            <td className="py-3.5 px-4 sm:px-6 text-right text-slate-400 font-mono text-[11px]">
                                                {mov.createdAt
                                                    ? new Date(mov.createdAt).toLocaleString("en-IN", {
                                                          dateStyle: "medium",
                                                          timeStyle: "short",
                                                      })
                                                    : "-"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
                    Showing <b>{filteredMovements.length}</b> movements
                </div>
            </div>

            {/* Movement Logging Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-bold text-slate-900">
                                Log Floor Stock Movement
                            </h3>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
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

                        <form onSubmit={handleCreateMovement} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Movement Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("IN")}
                                        className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                                            movementType === "IN"
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        Stock IN (Receiving)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMovementType("OUT")}
                                        className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                                            movementType === "OUT"
                                                ? "bg-rose-50 border-rose-500 text-rose-800"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        Stock OUT (Deduction)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Select Product
                                </label>
                                <select
                                    value={selectedInventoryId}
                                    onChange={(e) => setSelectedInventoryId(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    {inventoryOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.product?.name || `Product #${item.productId}`} (Current: {item.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="Enter units"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Floor Note / Reason
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Supplier delivery, dispatch order, damage audit"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    disabled={submitting}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-60"
                                >
                                    {submitting ? "Saving..." : "Record Movement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
