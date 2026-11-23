"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    ArrowDownToLine,
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    ChevronDown,
    ClipboardList,
    Eye,
    Loader2,
    Package,
    Plus,
    RefreshCw,
    Search,
    ShoppingCart,
    Trash2,
    Truck,
    X,
} from "lucide-react";

import api from "@/lib/api";
import AuthGuard from "@/components/auth/AuthGuard";

const BASE = "/purchaseOrder";
const PAGE_SIZE = 10;

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formatDate = (value) => {
    if (!value) return "Not scheduled";

    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
};

const getPayload = (response) => response?.data ?? response;

const getList = (response) => {
    const body = getPayload(response);

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.items)) return body.items;
    if (Array.isArray(body?.data?.items)) return body.data.items;

    return [];
};

const getRecord = (response) => {
    const body = getPayload(response);
    return body?.data ?? body?.purchaseOrder ?? body;
};

const getError = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const getWarehouseOptions = (response) => {
    const body = getPayload(response);

    const candidates = [
        body?.data?.options?.warehouses,
        body?.options?.warehouses,
        body?.data?.warehouses,
        body?.warehouses,
    ];

    return candidates.find(Array.isArray) || [];
};

function StatusBadge({ status }) {
    const config = {
        DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
        ORDERED: "bg-blue-50 text-blue-700 ring-blue-100",
        RECEIVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        CANCELLED: "bg-rose-50 text-rose-700 ring-rose-100",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 ring-inset ${config[status] || "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
        >
            {status || "UNKNOWN"}
        </span>
    );
}

function Field({ label, children, hint }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                {label}
            </span>

            {children}

            {hint && (
                <span className="mt-1 block text-[11px] text-slate-400">
                    {hint}
                </span>
            )}
        </label>
    );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                className={`max-h-[94vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? "max-w-5xl" : "max-w-xl"
                    }`}
            >
                <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1 text-xs text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="p-5 sm:p-6">{children}</div>
            </section>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, tone }) {
    const tones = {
        indigo: "bg-indigo-50 text-indigo-600",
        slate: "bg-slate-100 text-slate-600",
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{label}</p>

                <span className={`rounded-lg p-2 ${tones[tone]}`}>
                    <Icon size={16} />
                </span>
            </div>

            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                {value}
            </p>
        </div>
    );
}

export default function InventoryManagerPurchaseOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [lookupsLoading, setLookupsLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [supplierFilter, setSupplierFilter] = useState("ALL");
    const [warehouseFilter, setWarehouseFilter] = useState("ALL");

    const [page, setPage] = useState(1);

    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);

    const [deliveryDate, setDeliveryDate] = useState("");
    const [editDate, setEditDate] = useState(false);

    const [newOrder, setNewOrder] = useState({
        supplierId: "",
        warehouseId: "",
        expectedDeliveryDate: "",
    });

    const [itemDraft, setItemDraft] = useState({
        productId: "",
        quantity: "1",
        unitPrice: "",
    });

    const loadLookups = useCallback(async () => {
        setLookupsLoading(true);
        setError("");

        try {
            const results = await Promise.allSettled([
                api.get("/product"),
                api.get("/supplier"),
                api.get("/dashboard"),
            ]);

            if (results[0].status === "fulfilled") {
                setProducts(getList(results[0].value));
            }

            if (results[1].status === "fulfilled") {
                setSuppliers(getList(results[1].value));
            }

            if (results[2].status === "fulfilled") {
                setWarehouses(getWarehouseOptions(results[2].value));
            } else {
                throw results[2].reason;
            }
        } catch (err) {
            setError(getError(err, "Unable to load dropdown data."));
        } finally {
            setLookupsLoading(false);
        }
    }, []);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = {
                search: search.trim() || undefined,
                status: statusFilter !== "ALL" ? statusFilter : undefined,
                supplierId:
                    supplierFilter !== "ALL" ? supplierFilter : undefined,
                warehouseId:
                    warehouseFilter !== "ALL" ? warehouseFilter : undefined,
                limit: 100,
                offset: 0,
                sortBy: "createdAt",
                sortOrder: "DESC",
            };

            const response = await api.get(BASE, { params });
            setOrders(getList(response));
        } catch (err) {
            setError(getError(err, "Unable to load purchase orders."));
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, supplierFilter, warehouseFilter]);

    useEffect(() => {
        loadLookups();
    }, [loadLookups]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const refreshAll = async () => {
        await Promise.all([loadOrders(), loadLookups()]);
    };

    const stats = useMemo(() => {
        return {
            total: orders.length,
            draft: orders.filter((item) => item.status === "DRAFT").length,
            ordered: orders.filter((item) => item.status === "ORDERED").length,
            received: orders.filter((item) => item.status === "RECEIVED").length,
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders;
    }, [orders]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / PAGE_SIZE)
    );

    const paginatedOrders = filteredOrders.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const resetCreateForm = () => {
        setNewOrder({
            supplierId: "",
            warehouseId: "",
            expectedDeliveryDate: "",
        });

        setItemDraft({
            productId: "",
            quantity: "1",
            unitPrice: "",
        });
    };

    const handleCreateOrder = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (
            !newOrder.supplierId ||
            !newOrder.warehouseId ||
            !newOrder.expectedDeliveryDate
        ) {
            setError("Please fill all purchase order details.");
            return;
        }

        setBusy(true);

        try {
            const response = await api.post(BASE, {
                supplierId: Number(newOrder.supplierId),
                warehouseId: Number(newOrder.warehouseId),
                expectedDeliveryDate: newOrder.expectedDeliveryDate,
            });

            const created = getRecord(response);

            setShowCreate(false);
            resetCreateForm();
            setNotice("Purchase order created successfully.");

            await loadOrders();

            if (created?.id) {
                await openOrder(created.id);
            }
        } catch (err) {
            setError(getError(err, "Unable to create purchase order."));
        } finally {
            setBusy(false);
        }
    };

    const openOrder = async (orderId) => {
        setItemsLoading(true);
        setError("");
        setOrderItems([]);
        setEditDate(false);

        try {
            const [orderResponse, itemsResponse] = await Promise.all([
                api.get(`${BASE}/${orderId}`),
                api.get(`${BASE}/${orderId}/items`, {
                    params: {
                        limit: 100,
                        offset: 0,
                        sortBy: "id",
                        sortOrder: "ASC",
                    },
                }),
            ]);

            const order = getRecord(orderResponse);
            const items = getList(itemsResponse);

            setSelectedOrder(order);
            setOrderItems(items);
            setDeliveryDate(
                order?.expectedDeliveryDate
                    ? String(order.expectedDeliveryDate).slice(0, 10)
                    : ""
            );
        } catch (err) {
            setError(getError(err, "Unable to load purchase order details."));
        } finally {
            setItemsLoading(false);
        }
    };

    const handleAddItem = async (event) => {
        event.preventDefault();

        if (!selectedOrder?.id) return;

        const quantity = Number(itemDraft.quantity);
        const unitPrice = Number(itemDraft.unitPrice);

        if (!itemDraft.productId || !itemDraft.quantity || !itemDraft.unitPrice) {
            setError("Please fill all product details.");
            return;
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            setError("Quantity must be a positive whole number.");
            return;
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            setError("Please enter a valid unit price.");
            return;
        }

        setBusy(true);
        setError("");

        try {
            await api.post(`${BASE}/${selectedOrder.id}/items`, {
                productId: Number(itemDraft.productId),
                quantity,
                unitPrice,
            });

            setItemDraft({
                productId: "",
                quantity: "1",
                unitPrice: "",
            });

            setNotice("Product added to purchase order.");

            await openOrder(selectedOrder.id);
            await loadOrders();
        } catch (err) {
            setError(getError(err, "Unable to add product."));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!selectedOrder?.id) return;

        const confirmed = window.confirm(
            "Are you sure you want to remove this product?"
        );

        if (!confirmed) return;

        setBusy(true);
        setError("");

        try {
            await api.delete(
                `${BASE}/${selectedOrder.id}/items/${itemId}`
            );

            setNotice("Product removed successfully.");

            await openOrder(selectedOrder.id);
            await loadOrders();
        } catch (err) {
            setError(getError(err, "Unable to remove product."));
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateDate = async (event) => {
        event.preventDefault();

        if (!selectedOrder?.id || !deliveryDate) {
            setError("Please select expected delivery date.");
            return;
        }

        setBusy(true);
        setError("");

        try {
            await api.put(`${BASE}/${selectedOrder.id}`, {
                expectedDeliveryDate: deliveryDate,
            });

            setNotice("Expected delivery date updated.");

            setEditDate(false);
            await openOrder(selectedOrder.id);
            await loadOrders();
        } catch (err) {
            setError(getError(err, "Unable to update delivery date."));
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedOrder?.id) return;

        const message =
            status === "ORDERED"
                ? "Place this purchase order?"
                : "Cancel this purchase order?";

        if (!window.confirm(message)) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await api.patch(`${BASE}/${selectedOrder.id}`, { status });

            setNotice(
                status === "ORDERED"
                    ? "Purchase order placed successfully."
                    : "Purchase order cancelled."
            );

            await openOrder(selectedOrder.id);
            await loadOrders();
        } catch (err) {
            setError(getError(err, "Unable to update purchase order status."));
        } finally {
            setBusy(false);
        }
    };

    const handleReceiveOrder = async () => {
        if (!selectedOrder?.id) return;

        const confirmed = window.confirm(
            "Receive this purchase order? Inventory quantities will be updated."
        );

        if (!confirmed) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await api.post(`${BASE}/${selectedOrder.id}/receive`);

            setNotice("Purchase order received. Inventory has been updated.");

            await openOrder(selectedOrder.id);
            await loadOrders();
        } catch (err) {
            setError(getError(err, "Unable to receive purchase order."));
        } finally {
            setBusy(false);
        }
    };

    const getSupplierName = (order) =>
        order?.supplier?.name ||
        order?.supplier?.supplierName ||
        suppliers.find(
            (supplier) => Number(supplier.id) === Number(order.supplierId)
        )?.name ||
        suppliers.find(
            (supplier) => Number(supplier.id) === Number(order.supplierId)
        )?.supplierName ||
        `Supplier #${order?.supplierId || "-"}`;

    const getWarehouseName = (order) =>
        order?.warehouse?.name ||
        order?.warehouse?.warehouseName ||
        warehouses.find(
            (warehouse) => Number(warehouse.id) === Number(order.warehouseId)
        )?.name ||
        warehouses.find(
            (warehouse) => Number(warehouse.id) === Number(order.warehouseId)
        )?.warehouseName ||
        `Warehouse #${order?.warehouseId || "-"}`;

    const getItemProductName = (item) =>
        item?.product?.name ||
        item?.product?.productName ||
        products.find(
            (product) => Number(product.id) === Number(item.productId)
        )?.name ||
        `Product #${item?.productId || "-"}`;

    const orderTotal = useMemo(
        () =>
            orderItems.reduce(
                (total, item) =>
                    total +
                    Number(item.quantity || 0) *
                    Number(item.unitPrice || 0),
                0
            ),
        [orderItems]
    );

    const closeOrder = () => {
        setSelectedOrder(null);
        setOrderItems([]);
        setEditDate(false);
    };

    const changePage = (nextPage) => {
        setPage(Math.min(Math.max(nextPage, 1), totalPages));
    };

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, supplierFilter, warehouseFilter]);

    return (
        <AuthGuard allowedRoles={[4]}>
            <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
                {/* Page heading */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                                <ClipboardList size={20} />
                            </span>

                            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                Purchase Orders
                            </h1>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                            Create and manage supplier purchase orders.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={refreshAll}
                            disabled={loading || lookupsLoading}
                            className={secondaryButton}
                        >
                            <RefreshCw
                                size={15}
                                className={
                                    loading || lookupsLoading
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setNotice("");
                                resetCreateForm();
                                setShowCreate(true);
                            }}
                            className={primaryButton}
                        >
                            <Plus size={16} />
                            Create Purchase Order
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="flex-1">{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {notice && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                        <Check size={16} className="mt-0.5 shrink-0" />
                        <span className="flex-1">{notice}</span>

                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss notification"
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <StatCard
                        label="Total Orders"
                        value={stats.total}
                        icon={ClipboardList}
                        tone="indigo"
                    />

                    <StatCard
                        label="Draft Orders"
                        value={stats.draft}
                        icon={ShoppingCart}
                        tone="slate"
                    />

                    <StatCard
                        label="Ordered"
                        value={stats.ordered}
                        icon={Truck}
                        tone="blue"
                    />

                    <StatCard
                        label="Received"
                        value={stats.received}
                        icon={Package}
                        tone="emerald"
                    />
                </div>

                {/* Filters */}
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-800">
                            Purchase Order List
                        </h2>

                        <span className="text-[11px] text-slate-400">
                            {filteredOrders.length} records
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search purchase orders..."
                                className={`${inputClass} pl-9`}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ORDERED">Ordered</option>
                            <option value="RECEIVED">Received</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        <select
                            value={supplierFilter}
                            onChange={(event) =>
                                setSupplierFilter(event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="ALL">All Suppliers</option>

                            {suppliers.map((supplier) => (
                                <option
                                    key={supplier.id}
                                    value={supplier.id}
                                >
                                    {supplier.name ||
                                        supplier.supplierName ||
                                        `Supplier #${supplier.id}`}
                                </option>
                            ))}
                        </select>

                        <select
                            value={warehouseFilter}
                            onChange={(event) =>
                                setWarehouseFilter(event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="ALL">All Warehouses</option>

                            {warehouses.map((warehouse) => (
                                <option
                                    key={warehouse.id}
                                    value={warehouse.id}
                                >
                                    {warehouse.name ||
                                        warehouse.warehouseName ||
                                        `Warehouse #${warehouse.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Purchase Orders Table */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left">
                            <thead className="bg-slate-50">
                                <tr className="border-b border-slate-200">
                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Order ID
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Supplier
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Warehouse
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Expected Delivery
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center"
                                        >
                                            <Loader2
                                                size={22}
                                                className="mx-auto animate-spin text-indigo-600"
                                            />
                                            <p className="mt-2 text-xs text-slate-500">
                                                Loading purchase orders...
                                            </p>
                                        </td>
                                    </tr>
                                ) : paginatedOrders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center"
                                        >
                                            <ClipboardList
                                                size={28}
                                                className="mx-auto text-slate-300"
                                            />
                                            <p className="mt-2 text-sm font-semibold text-slate-700">
                                                No purchase orders found
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Create a purchase order to get
                                                started.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-slate-800">
                                                    PO-{order.id}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-xs font-semibold text-slate-700">
                                                    {getSupplierName(order)}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <p className="text-xs text-slate-600">
                                                    {getWarehouseName(order)}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                                    <CalendarDays
                                                        size={13}
                                                        className="text-slate-400"
                                                    />
                                                    {formatDate(
                                                        order.expectedDeliveryDate
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <StatusBadge
                                                    status={order.status}
                                                />
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openOrder(order.id)
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                            Showing{" "}
                            {filteredOrders.length
                                ? (page - 1) * PAGE_SIZE + 1
                                : 0}{" "}
                            to{" "}
                            {Math.min(
                                page * PAGE_SIZE,
                                filteredOrders.length
                            )}{" "}
                            of {filteredOrders.length} orders
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => changePage(page - 1)}
                                className={secondaryButton}
                            >
                                <ArrowLeft size={14} />
                                Previous
                            </button>

                            <span className="px-2 text-xs font-semibold text-slate-600">
                                {page} / {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => changePage(page + 1)}
                                className={secondaryButton}
                            >
                                Next
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Create Purchase Order Modal */}
                {showCreate && (
                    <Modal
                        title="Create Purchase Order"
                        subtitle="Start a new draft purchase order."
                        onClose={() => {
                            if (!busy) {
                                setShowCreate(false);
                                resetCreateForm();
                            }
                        }}
                    >
                        <form onSubmit={handleCreateOrder} className="space-y-5">
                            <Field label="Supplier *">
                                <select
                                    required
                                    value={newOrder.supplierId}
                                    onChange={(event) =>
                                        setNewOrder({ ...newOrder, supplierId: event.target.value })
                                    }
                                    className={inputClass}
                                    disabled={busy}
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name || supplier.supplierName || `Supplier #${supplier.id}`}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Warehouse *">
                                <select
                                    required
                                    value={newOrder.warehouseId}
                                    onChange={(event) =>
                                        setNewOrder({ ...newOrder, warehouseId: event.target.value })
                                    }
                                    className={inputClass}
                                    disabled={busy}
                                >
                                    <option value="">Select warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name || warehouse.warehouseName || `Warehouse #${warehouse.id}`}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Expected Delivery Date *">
                                <input
                                    type="date"
                                    required
                                    value={newOrder.expectedDeliveryDate}
                                    onChange={(event) =>
                                        setNewOrder({ ...newOrder, expectedDeliveryDate: event.target.value })
                                    }
                                    className={inputClass}
                                    disabled={busy}
                                />
                            </Field>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        resetCreateForm();
                                    }}
                                    className={secondaryButton}
                                    disabled={busy}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy || lookupsLoading || !warehouses.length || !suppliers.length}
                                    className={primaryButton}
                                >
                                    {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </Modal>
                )}

                {/* Purchase Order Details Modal */}
                {selectedOrder && (
                    <Modal
                        title={`Purchase Order #${selectedOrder.id}`}
                        subtitle="View products, update delivery date and manage order status."
                        onClose={closeOrder}
                        wide
                    >
                        {itemsLoading ? (
                            <div className="py-16 text-center">
                                <Loader2
                                    size={25}
                                    className="mx-auto animate-spin text-indigo-600"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Loading order details...
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Order overview */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            PO Number
                                        </p>

                                        <p className="mt-1 text-sm font-bold text-slate-800">
                                            PO-
                                            {String(selectedOrder.id).padStart(
                                                4,
                                                "0"
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            Supplier
                                        </p>

                                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                                            {getSupplierName(selectedOrder)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            Warehouse
                                        </p>

                                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                                            {getWarehouseName(selectedOrder)}
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            Status
                                        </p>

                                        <div className="mt-1">
                                            <StatusBadge
                                                status={selectedOrder.status}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expected delivery date */}
                                <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-700">
                                            Expected Delivery Date
                                        </p>

                                        {!editDate ? (
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {formatDate(
                                                    selectedOrder.expectedDeliveryDate
                                                )}
                                            </p>
                                        ) : (
                                            <form
                                                onSubmit={handleUpdateDate}
                                                className="mt-2 flex flex-wrap items-center gap-2"
                                            >
                                                <input
                                                    type="date"
                                                    value={deliveryDate}
                                                    onChange={(event) =>
                                                        setDeliveryDate(
                                                            event.target.value
                                                        )
                                                    }
                                                    className={`${inputClass} w-auto`}
                                                    required
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={busy}
                                                    className={primaryButton}
                                                >
                                                    <Check size={14} />
                                                    Save
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditDate(false)
                                                    }
                                                    className={secondaryButton}
                                                >
                                                    Cancel
                                                </button>
                                            </form>
                                        )}
                                    </div>

                                    {selectedOrder.status === "DRAFT" &&
                                        !editDate && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditDate(true)
                                                }
                                                className={secondaryButton}
                                            >
                                                <CalendarDays size={14} />
                                                Edit Date
                                            </button>
                                        )}
                                </div>

                                {/* Add product section */}
                                {selectedOrder.status === "DRAFT" && (
                                    <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                                                <Plus size={15} />
                                            </span>

                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800">
                                                    Add Products
                                                </h3>

                                                <p className="text-[11px] text-slate-500">
                                                    Add products to this purchase
                                                    order.
                                                </p>
                                            </div>
                                        </div>

                                        <form
                                            onSubmit={handleAddItem}
                                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
                                        >
                                            <Field label="Product *">
                                                <select
                                                    required
                                                    value={itemDraft.productId}
                                                    onChange={(event) =>
                                                        setItemDraft((prev) => ({
                                                            ...prev,
                                                            productId:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    className={inputClass}
                                                    disabled={busy}
                                                >
                                                    <option value="">
                                                        Select product
                                                    </option>

                                                    {products.map((product) => (
                                                        <option
                                                            key={product.id}
                                                            value={product.id}
                                                        >
                                                            {product.name ||
                                                                product.productName ||
                                                                `Product #${product.id}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>

                                            <Field label="Quantity *">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    required
                                                    value={itemDraft.quantity}
                                                    onChange={(event) =>
                                                        setItemDraft((prev) => ({
                                                            ...prev,
                                                            quantity:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    className={inputClass}
                                                    disabled={busy}
                                                />
                                            </Field>

                                            <Field label="Unit Price (₹) *">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    value={itemDraft.unitPrice}
                                                    onChange={(event) =>
                                                        setItemDraft((prev) => ({
                                                            ...prev,
                                                            unitPrice:
                                                                event.target
                                                                    .value,
                                                        }))
                                                    }
                                                    placeholder="Enter unit price"
                                                    className={inputClass}
                                                    disabled={busy}
                                                />
                                            </Field>

                                            <div className="flex items-end">
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        busy ||
                                                        !products.length
                                                    }
                                                    className={`${primaryButton} w-full`}
                                                >
                                                    {busy ? (
                                                        <Loader2
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Plus size={15} />
                                                    )}
                                                    Add Product
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                )}

                                {/* Order items */}
                                <section className="overflow-hidden rounded-xl border border-slate-200">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">
                                                Order Items
                                            </h3>

                                            <p className="text-[11px] text-slate-400">
                                                {orderItems.length} products
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                                Order Total
                                            </p>

                                            <p className="text-base font-bold text-indigo-600">
                                                {currency(orderTotal)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                        Product
                                                    </th>

                                                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                        Quantity
                                                    </th>

                                                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                        Unit Price
                                                    </th>

                                                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                        Total
                                                    </th>

                                                    {selectedOrder.status ===
                                                        "DRAFT" && (
                                                            <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                                                Action
                                                            </th>
                                                        )}
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {orderItems.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={
                                                                selectedOrder.status ===
                                                                    "DRAFT"
                                                                    ? 5
                                                                    : 4
                                                            }
                                                            className="px-3 py-10 text-center"
                                                        >
                                                            <Package
                                                                size={25}
                                                                className="mx-auto text-slate-300"
                                                            />

                                                            <p className="mt-2 text-xs font-semibold text-slate-600">
                                                                No products added
                                                                yet
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    orderItems.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-3 py-3">
                                                                <p className="text-xs font-semibold text-slate-800">
                                                                    {getItemProductName(
                                                                        item
                                                                    )}
                                                                </p>
                                                            </td>

                                                            <td className="px-3 py-3 text-xs text-slate-600">
                                                                {item.quantity}
                                                            </td>

                                                            <td className="px-3 py-3 text-xs text-slate-600">
                                                                {currency(
                                                                    item.unitPrice
                                                                )}
                                                            </td>

                                                            <td className="px-3 py-3 text-xs font-bold text-slate-800">
                                                                {currency(
                                                                    Number(
                                                                        item.quantity ||
                                                                        0
                                                                    ) *
                                                                    Number(
                                                                        item.unitPrice ||
                                                                        0
                                                                    )
                                                                )}
                                                            </td>

                                                            {selectedOrder.status ===
                                                                "DRAFT" && (
                                                                    <td className="px-3 py-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleDeleteItem(
                                                                                    item.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                busy
                                                                            }
                                                                            title="Remove product"
                                                                            className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 disabled:opacity-40"
                                                                        >
                                                                            <Trash2
                                                                                size={
                                                                                    14
                                                                                }
                                                                            />
                                                                        </button>
                                                                    </td>
                                                                )}
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Purchase Order Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                                    <div className="text-xs text-slate-500">
                                        {selectedOrder.status === "DRAFT" &&
                                            "Add all required products before placing this order."}
                                        {selectedOrder.status === "ORDERED" &&
                                            "This order is awaiting delivery."}
                                        {selectedOrder.status === "RECEIVED" &&
                                            "This order has been received and inventory has been updated."}
                                        {selectedOrder.status === "CANCELLED" &&
                                            "This purchase order has been cancelled."}
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2">
                                        {selectedOrder.status === "DRAFT" && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus("CANCELLED")
                                                    }
                                                    disabled={busy}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X size={15} />
                                                    Cancel Order
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus("ORDERED")
                                                    }
                                                    disabled={busy || orderItems.length === 0}
                                                    className={primaryButton}
                                                >
                                                    {busy ? (
                                                        <Loader2
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Check size={15} />
                                                    )}
                                                    Place Order
                                                </button>
                                            </>
                                        )}

                                        {selectedOrder.status === "ORDERED" && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus("CANCELLED")
                                                    }
                                                    disabled={busy}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X size={15} />
                                                    Cancel Order
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleReceiveOrder}
                                                    disabled={busy}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {busy ? (
                                                        <Loader2
                                                            size={15}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Truck size={15} />
                                                    )}
                                                    Receive Order
                                                </button>
                                            </>
                                        )}

                                        {selectedOrder.status === "RECEIVED" && (
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700">
                                                <Check size={15} />
                                                Inventory Updated
                                            </span>
                                        )}

                                        {selectedOrder.status === "CANCELLED" && (
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700">
                                                <X size={15} />
                                                Order Cancelled
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={closeOrder}
                                            className={secondaryButton}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal>
                )}
            </div>
        </AuthGuard>
    );
}