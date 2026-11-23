"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    ArrowRightLeft,
    Warehouse,
    Package,
    AlertCircle,
    CheckCircle2,
    Loader2,
    X,
    ArrowRight,
} from "lucide-react";

export default function StockTransferModal({
    isOpen,
    onClose,
    onSuccess,
    initialItem = null,
}) {
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [selectedProductId, setSelectedProductId] = useState("");
    const [sourceWarehouseId, setSourceWarehouseId] = useState("");
    const [destWarehouseId, setDestWarehouseId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");

    const [availableStock, setAvailableStock] = useState(null);
    const [checkingStock, setCheckingStock] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Load products and warehouses when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadPrerequisites = async () => {
            try {
                setLoadingData(true);
                setError("");

                const [prodRes, wareRes] = await Promise.all([
                    api.get("/product?limit=200"),
                    api.get("/warehouse?limit=100"),
                ]);

                const prodList = prodRes.data?.data?.rows || prodRes.data?.data || [];
                const wareList = wareRes.data?.data?.rows || wareRes.data?.data || [];

                setProducts(Array.isArray(prodList) ? prodList : []);
                setWarehouses(Array.isArray(wareList) ? wareList : []);

                // If launched from an existing inventory row
                if (initialItem) {
                    setSelectedProductId(String(initialItem.productId || ""));
                    setSourceWarehouseId(String(initialItem.warehouseId || ""));
                    setAvailableStock(Number(initialItem.quantity) || 0);
                } else if (prodList.length > 0) {
                    setSelectedProductId(String(prodList[0].id));
                }
            } catch (err) {
                console.error("Failed to load transfer prerequisites:", err);
                setError("Unable to load products or warehouses list.");
            } finally {
                setLoadingData(false);
            }
        };

        loadPrerequisites();
    }, [isOpen, initialItem]);

    // Check available stock when product or source warehouse changes
    useEffect(() => {
        if (!selectedProductId || !sourceWarehouseId) {
            setAvailableStock(null);
            return;
        }

        let isMounted = true;
        const fetchAvailable = async () => {
            try {
                setCheckingStock(true);
                const res = await api.get(
                    `/inventory?productId=${selectedProductId}&warehouseId=${sourceWarehouseId}`
                );
                const items = res.data?.data?.rows || res.data?.data || [];
                const matched = Array.isArray(items)
                    ? items.find(
                          (i) =>
                              Number(i.productId) === Number(selectedProductId) &&
                              Number(i.warehouseId) === Number(sourceWarehouseId)
                      )
                    : null;

                if (isMounted) {
                    setAvailableStock(matched ? Number(matched.quantity) : 0);
                }
            } catch {
                if (isMounted) setAvailableStock(0);
            } finally {
                if (isMounted) setCheckingStock(false);
            }
        };

        fetchAvailable();
        return () => {
            isMounted = false;
        };
    }, [selectedProductId, sourceWarehouseId]);

    if (!isOpen) return null;

    const handleTransferSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!selectedProductId || !sourceWarehouseId || !destWarehouseId) {
            setError("Please select product, source warehouse, and destination warehouse.");
            return;
        }

        if (sourceWarehouseId === destWarehouseId) {
            setError("Source and destination warehouses cannot be the same.");
            return;
        }

        const qtyNum = Number(quantity);
        if (!qtyNum || qtyNum <= 0) {
            setError("Transfer quantity must be greater than 0.");
            return;
        }

        if (availableStock !== null && qtyNum > availableStock) {
            setError(`Cannot transfer ${qtyNum} units. Only ${availableStock} available in source.`);
            return;
        }

        setSubmitting(true);

        try {
            const res = await api.post("/stockTransfer", {
                productId: Number(selectedProductId),
                fromWarehouseId: Number(sourceWarehouseId),
                toWarehouseId: Number(destWarehouseId),
                quantity: qtyNum,
                note: note.trim() || undefined,
            });

            if (res.data?.success) {
                setSuccessMsg(res.data?.message || "Stock transferred successfully!");
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                }, 1200);
            } else {
                setError(res.data?.message || "Transfer failed.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Transfer operation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                            <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Inter-Warehouse Transfer
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Move verified stock between locations with atomic movement logs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                    {/* Product Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Product
                        </label>
                        <select
                            disabled={loadingData || initialItem}
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                        >
                            <option value="">Select a product...</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* From & To Warehouses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Source Warehouse (From)
                            </label>
                            <select
                                disabled={loadingData || initialItem}
                                value={sourceWarehouseId}
                                onChange={(e) => setSourceWarehouseId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                            >
                                <option value="">Select source...</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Destination Warehouse (To)
                            </label>
                            <select
                                disabled={loadingData}
                                value={destWarehouseId}
                                onChange={(e) => setDestWarehouseId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                            >
                                <option value="">Select destination...</option>
                                {warehouses
                                    .filter((w) => String(w.id) !== String(sourceWarehouseId))
                                    .map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Available Stock Indicator */}
                    {sourceWarehouseId && selectedProductId && (
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs border border-slate-200 dark:border-slate-700/60">
                            <span className="text-slate-600 dark:text-slate-400">Available at Source:</span>
                            {checkingStock ? (
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                <span
                                    className={`font-bold ${
                                        availableStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                                    }`}
                                >
                                    {availableStock !== null ? `${availableStock} units` : "0 units"}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Quantity */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Transfer Quantity
                            </label>
                            {availableStock > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setQuantity(String(availableStock))}
                                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Transfer All ({availableStock})
                                </button>
                            )}
                        </div>
                        <input
                            type="number"
                            min="1"
                            max={availableStock || undefined}
                            required
                            placeholder="Enter units to move..."
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Transfer Reason / Reference (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Regional redistribution, high demand replenishment"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || (availableStock !== null && availableStock <= 0)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-[0.99] transition disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Executing Transfer...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="h-4 w-4" />
                                    <span>Confirm Transfer</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
