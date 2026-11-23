
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

import {
    Package,
    Plus,
    Search,
    RefreshCw,
    Edit,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    X,
    Warehouse,
    Boxes,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Filter,
    ArrowRightLeft,
    Download,
} from "lucide-react";
import { exportToCsv } from "@/Utils/csvHelper";
import StockTransferModal from "@/components/inventory/StockTransferModal";

// --------------------------------------------------
// CONSTANTS & HELPERS
// --------------------------------------------------

const PAGE_SIZE = 10;

const EMPTY_FORM = {
    productId: "",
    warehouseId: "",
    quantity: "0",
    reorderLevel: "10",
};

const getRows = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.inventory)) return data.inventory;

    return [];
};

const getWarehouses = (response) => {
    const warehouses = response?.data?.data?.options?.warehouses;

    return Array.isArray(warehouses) ? warehouses : [];
};

const getId = (item) =>
    Number(item?.id ?? item?.warehouseId ?? item?.productId);

const getWarehouseName = (warehouse) =>
    warehouse?.name ??
    warehouse?.warehouseName ??
    warehouse?.warehouse?.name ??
    `Warehouse ${getId(warehouse)}`;

const getProductName = (item) =>
    item?.product?.name ??
    item?.name ??
    `Product ${item?.productId ?? ""}`;

const getStockStatus = (quantity, reorderLevel) => {
    const qty = Number(quantity || 0);
    const reorder = Number(reorderLevel || 0);

    if (qty <= 0) {
        return {
            label: "Out of Stock",
            className: "bg-red-50 text-red-700 border-red-200",
        };
    }

    if (qty <= reorder) {
        return {
            label: "Low Stock",
            className: "bg-amber-50 text-amber-700 border-amber-200",
        };
    }

    return {
        label: "In Stock",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
};

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
    "mb-1.5 block text-xs font-semibold text-slate-600";

// --------------------------------------------------
// SMALL COMPONENTS
// --------------------------------------------------

function StatCard({ title, value, subtitle, icon: Icon, iconClass }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                        {value}
                    </h3>

                    {subtitle && (
                        <p className="mt-1 text-[11px] text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ quantity, reorderLevel }) {
    const status = getStockStatus(quantity, reorderLevel);

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
            {status.label}
        </span>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package size={30} className="text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
                {message}
            </p>
        </div>
    );
}

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

function InventoryContent() {
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [warehouseFilter, setWarehouseFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferItem, setTransferItem] = useState(null);
    const [reorderingId, setReorderingId] = useState(null);
    const [reorderBanner, setReorderBanner] = useState("");

    const triggerQuickReorder = async (item) => {
        try {
            setReorderingId(item.id);
            setReorderBanner("");
            const res = await api.post("/inventory/auto-reorder", {
                productId: item.productId,
                warehouseId: item.warehouseId,
            });

            if (res.data?.success) {
                setReorderBanner(res.data.message);
                loadInventory();
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Failed to trigger auto reorder");
        } finally {
            setReorderingId(null);
        }
    };

    const handleExportCsv = () => {
        exportToCsv("Manager_Inventory_Report", inventory, [
            { key: "id", label: "Inventory ID" },
            { key: "product.name", label: "Product Name" },
            { key: "product.sku", label: "SKU" },
            { key: "warehouse.name", label: "Warehouse" },
            { key: "quantity", label: "Quantity" },
            { key: "reorderLevel", label: "Reorder Level" },
        ]);
    };

    // --------------------------------------------------
    // FETCH DATA
    // --------------------------------------------------

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [inventoryResult, productResult, dashboardResult] =
                await Promise.allSettled([
                    api.get("/inventory"),
                    api.get("/product"),
                    api.get("/dashboard"),
                ]);

            // Fail closed if inventory or assigned warehouse data fails.
            if (inventoryResult.status === "rejected") {
                throw inventoryResult.reason;
            }

            if (dashboardResult.status === "rejected") {
                throw new Error(
                    "Unable to fetch assigned warehouses. Please refresh the page."
                );
            }

            const inventoryRows = getRows(inventoryResult.value);
            const assignedWarehouses = getWarehouses(
                dashboardResult.value
            );

            const productRows =
                productResult.status === "fulfilled"
                    ? getRows(productResult.value)
                    : [];

            setInventory(inventoryRows);
            setProducts(productRows);
            setWarehouses(assignedWarehouses);

            // Reset selected warehouse if it is no longer assigned.
            setWarehouseFilter((current) => {
                if (current === "all") return current;

                const stillAssigned = assignedWarehouses.some(
                    (warehouse) => String(getId(warehouse)) === current
                );

                return stillAssigned ? current : "all";
            });
        } catch (err) {
            console.error("Inventory Fetch Error:", err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --------------------------------------------------
    // FILTER & SORT
    // --------------------------------------------------

    const filteredInventory = useMemo(() => {
        let result = [...inventory];

        if (warehouseFilter !== "all") {
            result = result.filter(
                (item) =>
                    String(item.warehouseId) === warehouseFilter
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((item) => {
                const quantity = Number(item.quantity || 0);
                const reorderLevel = Number(item.reorderLevel || 0);

                if (statusFilter === "out") {
                    return quantity <= 0;
                }

                if (statusFilter === "low") {
                    return quantity > 0 && quantity <= reorderLevel;
                }

                if (statusFilter === "in") {
                    return quantity > reorderLevel;
                }

                return true;
            });
        }

        if (search.trim()) {
            const query = search.toLowerCase().trim();

            result = result.filter((item) => {
                const productName = getProductName(item).toLowerCase();
                const sku = String(item.product?.sku || "").toLowerCase();
                const warehouse = warehouses.find(
                    (w) => getId(w) === Number(item.warehouseId)
                );

                const warehouseName = getWarehouseName(
                    warehouse || item.warehouse
                ).toLowerCase();

                return (
                    productName.includes(query) ||
                    sku.includes(query) ||
                    warehouseName.includes(query)
                );
            });
        }

        result.sort((a, b) => {
            if (sortOrder === "quantity-low") {
                return Number(a.quantity) - Number(b.quantity);
            }

            if (sortOrder === "quantity-high") {
                return Number(b.quantity) - Number(a.quantity);
            }

            if (sortOrder === "name") {
                return getProductName(a).localeCompare(
                    getProductName(b)
                );
            }

            return Number(b.id) - Number(a.id);
        });

        return result;
    }, [
        inventory,
        warehouseFilter,
        statusFilter,
        search,
        sortOrder,
        warehouses,
    ]);

    // --------------------------------------------------
    // SUMMARY
    // --------------------------------------------------

    const stats = useMemo(() => {
        const total = filteredInventory.length;

        const lowStock = filteredInventory.filter((item) => {
            const quantity = Number(item.quantity || 0);
            const reorder = Number(item.reorderLevel || 0);

            return quantity > 0 && quantity <= reorder;
        }).length;

        const outOfStock = filteredInventory.filter(
            (item) => Number(item.quantity || 0) <= 0
        ).length;

        const totalUnits = filteredInventory.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );

        return {
            total,
            lowStock,
            outOfStock,
            totalUnits,
        };
    }, [filteredInventory]);

    // --------------------------------------------------
    // PAGINATION
    // --------------------------------------------------

    const totalPages = Math.max(
        1,
        Math.ceil(filteredInventory.length / PAGE_SIZE)
    );

    const paginatedInventory = filteredInventory.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, warehouseFilter, statusFilter, sortOrder]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // --------------------------------------------------
    // MODAL HANDLERS
    // --------------------------------------------------

    const openCreateModal = () => {
        setEditingItem(null);

        setForm({
            ...EMPTY_FORM,
            warehouseId:
                warehouses.length === 1
                    ? String(getId(warehouses[0]))
                    : "",
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);

        setForm({
            productId: String(item.productId),
            warehouseId: String(item.warehouseId),
            quantity: String(item.quantity),
            reorderLevel: String(item.reorderLevel ?? 0),
        });

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingItem(null);
        setForm(EMPTY_FORM);
    };

    const handleFormChange = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // --------------------------------------------------
    // CREATE / UPDATE INVENTORY
    // --------------------------------------------------

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const quantity = Number(form.quantity);
        const reorderLevel = Number(form.reorderLevel);
        const productId = Number(form.productId);
        const warehouseId = Number(form.warehouseId);

        if (!editingItem) {
            if (!form.productId || !form.warehouseId) {
                setError("Please select a product and warehouse.");
                return;
            }

            const assignedWarehouse = warehouses.some(
                (warehouse) => getId(warehouse) === warehouseId
            );

            if (!assignedWarehouse) {
                setError(
                    "You are not assigned to the selected warehouse."
                );
                return;
            }

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity < 0
            ) {
                setError("Please enter valid product and quantity values.");
                return;
            }
        }

        if (
            !Number.isInteger(reorderLevel) ||
            reorderLevel < 0
        ) {
            setError(
                "Reorder level must be a non-negative integer."
            );
            return;
        }

        setSaving(true);

        try {
            if (editingItem) {
                await api.patch(`/inventory/${editingItem.id}`, {
                    reorderLevel,
                });

                setSuccess("Reorder level updated successfully.");
            } else {
                await api.post("/inventory", {
                    productId,
                    warehouseId,
                    quantity,
                    reorderLevel,
                });

                setSuccess("Inventory created successfully.");
            }

            setShowModal(false);
            setEditingItem(null);
            setForm(EMPTY_FORM);

            await loadData();
        } catch (err) {
            console.error("Inventory Save Error:", err);
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // DELETE INVENTORY
    // --------------------------------------------------

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete inventory for "${getProductName(item)}"?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await api.delete(`/inventory/${item.id}`);

            setSuccess("Inventory deleted successfully.");

            await loadData();
        } catch (err) {
            console.error("Inventory Delete Error:", err);
            setError(getErrorMessage(err));
        }
    };

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">

            {/* PAGE HEADER */}

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Package size={19} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                Inventory
                            </h1>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Manage stock across your assigned warehouses.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                        title="Export inventory data to CSV"
                    >
                        <Download size={14} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTransferItem(null);
                            setShowTransferModal(true);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 transition hover:bg-blue-100 dark:hover:bg-blue-900/60"
                        title="Transfer stock to another warehouse"
                    >
                        <ArrowRightLeft size={14} />
                        Transfer Stock
                    </button>

                    <button
                        type="button"
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={14}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        disabled={loading || warehouses.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus size={15} />
                        Add Inventory
                    </button>
                </div>
            </div>

            {/* ALERTS */}

            {error && !showModal && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span className="flex-1">{error}</span>

                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Close error"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {reorderBanner && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    <CheckCircle2 size={15} />
                    <span className="flex-1 font-semibold">{reorderBanner}</span>
                    <button
                        type="button"
                        onClick={() => setReorderBanner("")}
                        aria-label="Close message"
                        className="cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    <CheckCircle2 size={15} />
                    <span className="flex-1">{success}</span>

                    <button
                        type="button"
                        onClick={() => setSuccess("")}
                        aria-label="Close success message"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* STATS */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Inventory Items"
                    value={loading ? "—" : stats.total}
                    subtitle="Products in selected view"
                    icon={Package}
                    iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                    title="Total Available Units"
                    value={loading ? "—" : stats.totalUnits.toLocaleString()}
                    subtitle="Combined stock quantity"
                    icon={Boxes}
                    iconClass="bg-violet-50 text-violet-600"
                />

                <StatCard
                    title="Low Stock Items"
                    value={loading ? "—" : stats.lowStock}
                    subtitle="At or below reorder level"
                    icon={AlertTriangle}
                    iconClass="bg-amber-50 text-amber-600"
                />

                <StatCard
                    title="Out of Stock"
                    value={loading ? "—" : stats.outOfStock}
                    subtitle="Items with zero quantity"
                    icon={XCircle}
                    iconClass="bg-red-50 text-red-600"
                />
            </div>

            {/* FILTERS */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                    <Filter size={15} className="text-slate-500" />
                    <h2 className="text-sm font-semibold text-slate-800">
                        Filters
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="relative">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search product or SKU..."
                            className={`${inputClass} pl-9`}
                        />
                    </div>

                    <select
                        value={warehouseFilter}
                        onChange={(e) =>
                            setWarehouseFilter(e.target.value)
                        }
                        className={inputClass}
                    >
                        <option value="all">
                            All Assigned Warehouses
                        </option>

                        {warehouses.map((warehouse) => (
                            <option
                                key={getId(warehouse)}
                                value={String(getId(warehouse))}
                            >
                                {getWarehouseName(warehouse)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className={inputClass}
                    >
                        <option value="all">All Stock Status</option>
                        <option value="in">In Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="out">Out of Stock</option>
                    </select>

                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className={inputClass}
                    >
                        <option value="newest">Recently Added</option>
                        <option value="name">Product Name</option>
                        <option value="quantity-low">
                            Quantity: Low to High
                        </option>
                        <option value="quantity-high">
                            Quantity: High to Low
                        </option>
                    </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-700">
                            {filteredInventory.length}
                        </span>{" "}
                        inventory records
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setWarehouseFilter("all");
                            setStatusFilter("all");
                            setSortOrder("newest");
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* INVENTORY TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                            Inventory Records
                        </h2>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            Stock quantities are managed through Stock Movement.
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Warehouse size={14} />
                        {warehouses.length} assigned warehouse
                        {warehouses.length !== 1 ? "s" : ""}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-12 animate-pulse rounded-lg bg-slate-100"
                            />
                        ))}
                    </div>
                ) : error && inventory.length === 0 ? (
                    <EmptyState message="Unable to load inventory records." />
                ) : paginatedInventory.length === 0 ? (
                    <EmptyState
                        message={
                            inventory.length === 0
                                ? "No inventory records found. Add your first inventory item."
                                : "No inventory records match your filters."
                        }
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left">
                                <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Product
                                        </th>

                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            SKU
                                        </th>

                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Warehouse
                                        </th>

                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Quantity
                                        </th>

                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Reorder Level
                                        </th>

                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {paginatedInventory.map((item) => {
                                        const warehouse =
                                            warehouses.find(
                                                (w) =>
                                                    getId(w) ===
                                                    Number(item.warehouseId)
                                            ) || item.warehouse;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                            <Package size={15} />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="max-w-[220px] truncate text-xs font-semibold text-slate-800">
                                                                {getProductName(item)}
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                ID: {item.productId}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-slate-600">
                                                    {item.product?.sku || "—"}
                                                </td>

                                                <td className="px-4 py-3 text-xs text-slate-600">
                                                    {getWarehouseName(warehouse)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-bold tabular-nums text-slate-800">
                                                        {Number(item.quantity || 0).toLocaleString()}
                                                    </span>
                                                    <span className="ml-1 text-[10px] text-slate-400">
                                                        units
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-xs font-medium tabular-nums text-slate-600">
                                                    {Number(item.reorderLevel || 0)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <StatusBadge
                                                        quantity={item.quantity}
                                                        reorderLevel={item.reorderLevel}
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {Number(item.quantity) <= Number(item.reorderLevel) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => triggerQuickReorder(item)}
                                                                disabled={reorderingId === item.id}
                                                                title="1-Click Auto Reorder: Generate draft PO"
                                                                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                                                            >
                                                                {reorderingId === item.id ? (
                                                                    <span className="h-3 w-3 animate-spin rounded-full border border-amber-700 dark:border-amber-400 border-t-transparent" />
                                                                ) : (
                                                                    <span>⚡ Reorder</span>
                                                                )}
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(item)
                                                            }
                                                            title="Edit reorder level"
                                                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Edit size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(item)
                                                            }
                                                            title="Delete inventory"
                                                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}

                        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
                            <p className="text-[11px] text-slate-500">
                                Showing{" "}
                                {filteredInventory.length === 0
                                    ? 0
                                    : (currentPage - 1) * PAGE_SIZE + 1}
                                {" - "}
                                {Math.min(
                                    currentPage * PAGE_SIZE,
                                    filteredInventory.length
                                )}{" "}
                                of {filteredInventory.length}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() =>
                                        setCurrentPage((page) => page - 1)
                                    }
                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={15} />
                                </button>

                                <span className="text-xs font-medium text-slate-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() =>
                                        setCurrentPage((page) => page + 1)
                                    }
                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Stock Transfer Modal */}
            <StockTransferModal
                isOpen={showTransferModal}
                onClose={() => {
                    setShowTransferModal(false);
                    setTransferItem(null);
                }}
                initialItem={transferItem}
                onSuccess={loadData}
            />

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    {editingItem
                                        ? "Update Reorder Level"
                                        : "Add Inventory"}
                                </h2>

                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    {editingItem
                                        ? "Update the minimum stock threshold."
                                        : "Create an opening inventory record."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-5">
                            {error && (
                                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                                    <AlertTriangle
                                        size={15}
                                        className="mt-0.5 shrink-0"
                                    />
                                    {error}
                                </div>
                            )}

                            {!editingItem && (
                                <>
                                    <div>
                                        <label className={labelClass}>
                                            Product
                                            <span className="text-red-500"> *</span>
                                        </label>

                                        <select
                                            required
                                            value={form.productId}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "productId",
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Select Product
                                            </option>

                                            {products.map((product) => (
                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >
                                                    {product.name}
                                                    {product.sku
                                                        ? ` (${product.sku})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>

                                        {products.length === 0 && (
                                            <p className="mt-1 text-[10px] text-amber-600">
                                                No products available. Please check product access.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Assigned Warehouse
                                            <span className="text-red-500"> *</span>
                                        </label>

                                        <select
                                            required
                                            value={form.warehouseId}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "warehouseId",
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                        >
                                            <option value="">
                                                Select Warehouse
                                            </option>

                                            {warehouses.map((warehouse) => (
                                                <option
                                                    key={getId(warehouse)}
                                                    value={getId(warehouse)}
                                                >
                                                    {getWarehouseName(warehouse)}
                                                </option>
                                            ))}
                                        </select>

                                        {warehouses.length === 0 && (
                                            <p className="mt-1 text-[10px] text-red-600">
                                                No warehouse is assigned to your account.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Opening Quantity
                                            <span className="text-red-500"> *</span>
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            required
                                            value={form.quantity}
                                            onChange={(e) =>
                                                handleFormChange(
                                                    "quantity",
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                            placeholder="Enter opening quantity"
                                        />
                                    </div>
                                </>
                            )}

                            {editingItem && (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[10px] font-medium uppercase text-slate-400">
                                        Product
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {getProductName(editingItem)}
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400">
                                                Warehouse
                                            </p>

                                            <p className="mt-1 text-xs font-medium text-slate-700">
                                                {getWarehouseName(
                                                    warehouses.find(
                                                        (w) =>
                                                            getId(w) ===
                                                            Number(editingItem.warehouseId)
                                                    ) || editingItem.warehouse
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-slate-400">
                                                Current Quantity
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {Number(editingItem.quantity || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>
                                    Reorder Level
                                    <span className="text-red-500"> *</span>
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={form.reorderLevel}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "reorderLevel",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="Enter reorder level"
                                />

                                <p className="mt-1 text-[10px] text-slate-400">
                                    Low-stock alert triggers when quantity is at or below this value.
                                </p>
                            </div>

                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                                <p className="text-[11px] leading-5 text-blue-700">
                                    <strong>Note:</strong> Existing stock quantity cannot be edited here. Use the Stock Movement module for stock IN and OUT operations.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        (!editingItem &&
                                            (products.length === 0 ||
                                                warehouses.length === 0))
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving && (
                                        <RefreshCw
                                            size={13}
                                            className="animate-spin"
                                        />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Inventory"
                                            : "Create Inventory"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------
// AUTH GUARD
// --------------------------------------------------

export default function InventoryPage() {
    return (
        <AuthGuard allowedRoles={[4]}>
            <InventoryContent />
        </AuthGuard>
    );
}
