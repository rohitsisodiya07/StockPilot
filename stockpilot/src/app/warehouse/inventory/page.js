"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import {
    Boxes,
    Search,
    RefreshCw,
    AlertTriangle,
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    Warehouse,
    Plus,
    Minus,
    ArrowRightLeft,
    Download,
} from "lucide-react";
import { exportToCsv } from "@/Utils/csvHelper";
import StockTransferModal from "@/components/inventory/StockTransferModal";

export default function WarehouseInventoryPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
    const [inventoryList, setInventoryList] = useState([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    const [error, setError] = useState("");

    // Quick Move Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [movementType, setMovementType] = useState("IN");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");

    // Transfer Modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferItem, setTransferItem] = useState(null);

    const handleExportCsv = () => {
        exportToCsv("Warehouse_Floor_Inventory", inventoryList, [
            { key: "id", label: "Inventory ID" },
            { key: "product.name", label: "Product Name" },
            { key: "product.sku", label: "SKU" },
            { key: "quantity", label: "Shelf Quantity" },
            { key: "reorderLevel", label: "Reorder Level" },
        ]);
    };

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

    const loadInventory = useCallback(async (warehouseId, isRefresh = false) => {
        if (!warehouseId) {
            setLoading(false);
            return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            setError("");
            const res = await api.get(`/inventory/warehouse/${warehouseId}`);
            const data = res.data?.data || res.data || [];
            setInventoryList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error loading inventory:", err);
            setError(err.response?.data?.message || "Failed to load inventory.");
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
            loadInventory(selectedWarehouseId);
        }
    }, [selectedWarehouseId, loadInventory]);

    const handleMovementSubmit = async (e) => {
        e.preventDefault();
        setModalError("");
        setModalSuccess("");

        const qtyNum = Number(quantity);
        if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
            setModalError("Quantity must be a positive integer.");
            return;
        }

        if (movementType === "OUT" && qtyNum > Number(selectedItem.quantity)) {
            setModalError(`Cannot deduct ${qtyNum} units. Current stock is ${selectedItem.quantity}.`);
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/stockMovement", {
                inventoryId: selectedItem.id,
                type: movementType,
                quantity: qtyNum,
                note: note.trim() || `Floor Quick ${movementType}`,
            });

            setModalSuccess(`Successfully updated stock for ${selectedItem.product?.name || "Product"}.`);
            await loadInventory(selectedWarehouseId, true);

            setTimeout(() => {
                setModalOpen(false);
                setModalSuccess("");
            }, 1000);
        } catch (err) {
            console.error("Movement error:", err);
            setModalError(err.response?.data?.message || "Failed to record movement.");
        } finally {
            setSubmitting(false);
        }
    };

    const openMoveModal = (item, type = "IN") => {
        setSelectedItem(item);
        setMovementType(type);
        setQuantity("");
        setNote("");
        setModalError("");
        setModalSuccess("");
        setModalOpen(true);
    };

    const filteredItems = useMemo(() => {
        return inventoryList.filter((item) => {
            const name = item.product?.name?.toLowerCase() || "";
            const sku = item.product?.sku?.toLowerCase() || "";
            const matchesSearch = name.includes(search.toLowerCase()) || sku.includes(search.toLowerCase());

            const qty = Number(item.quantity || 0);
            const reorder = Number(item.reorderLevel || 10);

            if (!matchesSearch) return false;

            if (filterStatus === "IN_STOCK") return qty > reorder;
            if (filterStatus === "LOW_STOCK") return qty > 0 && qty <= reorder;
            if (filterStatus === "OUT_OF_STOCK") return qty <= 0;

            return true;
        });
    }, [inventoryList, search, filterStatus]);

    const activeWarehouse = warehouses.find((w) => String(w.id) === String(selectedWarehouseId));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Warehouse Stock Inventory
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Real-time stock levels, SKU tracking, and fast floor adjustments.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        title="Export inventory to CSV"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTransferItem(null);
                            setShowTransferModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                        title="Transfer stock to another warehouse"
                    >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>Transfer Stock</span>
                    </button>

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
                        onClick={() => loadInventory(selectedWarehouseId, true)}
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
                        placeholder="Search product name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { id: "ALL", label: "All Items" },
                        { id: "IN_STOCK", label: "In Stock" },
                        { id: "LOW_STOCK", label: "Low Stock" },
                        { id: "OUT_OF_STOCK", label: "Out of Stock" },
                    ].map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setFilterStatus(btn.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                filterStatus === btn.id
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 sm:px-6">Product Details</th>
                                <th className="py-3.5 px-4">SKU</th>
                                <th className="py-3.5 px-4 text-center">Available Units</th>
                                <th className="py-3.5 px-4 text-center">Reorder Level</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-4 sm:px-6 text-right">Floor Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        Loading warehouse inventory...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <Boxes className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Inventory Items Found</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Try adjusting your search query or filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const qty = Number(item.quantity || 0);
                                    const reorder = Number(item.reorderLevel || 10);
                                    const isOut = qty <= 0;
                                    const isLow = qty > 0 && qty <= reorder;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-4 px-4 sm:px-6">
                                                <p className="font-bold text-slate-900 text-sm">
                                                    {item.product?.name || `Product #${item.productId}`}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                                    {item.product?.description || "No description"}
                                                </p>
                                            </td>

                                            <td className="py-4 px-4 font-mono font-medium text-slate-600">
                                                {item.product?.sku || "-"}
                                            </td>

                                            <td className="py-4 px-4 text-center">
                                                <span className="text-base font-extrabold text-slate-900">
                                                    {qty}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4 text-center text-slate-500 font-medium">
                                                {reorder}
                                            </td>

                                            <td className="py-4 px-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold border ${
                                                        isOut
                                                            ? "bg-red-50 text-red-700 border-red-200"
                                                            : isLow
                                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    }`}
                                                >
                                                    {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                                                </span>
                                            </td>

                                            <td className="py-4 px-4 sm:px-6 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setTransferItem(item);
                                                            setShowTransferModal(true);
                                                        }}
                                                        title="Transfer Stock"
                                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                                                    >
                                                        <ArrowRightLeft className="h-3 w-3" />
                                                        <span>Transfer</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openMoveModal(item, "IN")}
                                                        title="Stock In (+)"
                                                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        <span>In</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openMoveModal(item, "OUT")}
                                                        title="Stock Out (-)"
                                                        className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                        <span>Out</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 p-4 text-xs text-slate-500 flex items-center justify-between">
                    <span>
                        Showing <b>{filteredItems.length}</b> of <b>{inventoryList.length}</b> inventory records
                    </span>
                    <span>Facility: <b>{activeWarehouse?.name || "Assigned Warehouse"}</b></span>
                </div>
            </div>

            {/* Inter-Warehouse Transfer Modal */}
            <StockTransferModal
                isOpen={showTransferModal}
                onClose={() => {
                    setShowTransferModal(false);
                    setTransferItem(null);
                }}
                initialItem={transferItem}
                onSuccess={() => loadInventory(selectedWarehouseId, true)}
            />

            {/* Movement Modal */}
            {modalOpen && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Record Stock {movementType}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {selectedItem.product?.name} (SKU: {selectedItem.product?.sku})
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

                        <form onSubmit={handleMovementSubmit} className="mt-4 space-y-4">
                            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs flex justify-between items-center">
                                <span className="text-slate-500">Current Shelf Stock:</span>
                                <span className="font-bold text-slate-900 text-sm">
                                    {selectedItem.quantity} units
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Quantity ({movementType === "IN" ? "Add to shelf" : "Deduct from shelf"})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    placeholder="e.g. 25"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Floor Note / Reason
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Batch received, customer dispatch, damaged"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
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
                                    className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition ${
                                        movementType === "IN"
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-rose-600 hover:bg-rose-700"
                                    }`}
                                >
                                    {submitting ? "Processing..." : `Confirm Stock ${movementType}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
