"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";
import PrintableDocumentModal from "@/components/documents/PrintableDocumentModal";

const STATUSES = ["DRAFT", "CONFIRMED", "DISPATCHED", "CANCELLED"];

const STATUS_STYLES = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    DISPATCHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

const EMPTY_CUSTOMER = {
    customerName: "",
    customerEmail: "",
    warehouseId: "",
};

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const getArray = (response) => {
    const data = response?.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.warehouses)) return data.warehouses;
    return [];
};

function Icon({ name, size = 18, className = "" }) {
    const paths = {
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
        warehouse: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></>,
        truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z" /><circle cx="7.5" cy="19" r="1.5" /><circle cx="17.5" cy="19" r="1.5" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
        filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
        minus: <path d="M5 12h14" />,
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {paths[name] || paths.package}
        </svg>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.DRAFT}`}>
            {status || "DRAFT"}
        </span>
    );
}

function SummaryCard({ title, value, note, icon, tone }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700",
        slate: "bg-slate-100 text-slate-700",
        green: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{note}</p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
                    <Icon name={icon} size={18} />
                </div>
            </div>
        </div>
    );
}

function Field({ label, children, required = false }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                {label}{required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            {children}
        </label>
    );
}

const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Modal({ title, subtitle, onClose, children, wide = false }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-[2px] sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className={`my-auto w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{title}</h2>
                        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function SalesOrdersContent() {
    const [orders, setOrders] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalRecords: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [sortOrder, setSortOrder] = useState("DESC");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
    const [selectedItems, setSelectedItems] = useState([]);
    const [productToAdd, setProductToAdd] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [creating, setCreating] = useState(false);
    const [modalError, setModalError] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [actionBusy, setActionBusy] = useState(false);
    const [printDoc, setPrintDoc] = useState(null);

    const loadOrders = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        try {
            const response = await api.get("/salesOrder", {
                params: {
                    page,
                    limit: 10,
                    search: search.trim() || undefined,
                    status: status || undefined,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    sortBy: "createdAt",
                    sortOrder,
                },
            });

            if (response.data?.success === false) {
                throw new Error(response.data?.message || "Unable to load sales orders.");
            }

            setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
            setPagination(response.data?.pagination || {
                page,
                limit: 10,
                totalRecords: 0,
                totalPages: 0,
            });
        } catch (requestError) {
            setError(getMessage(requestError, "Could not load sales orders."));
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, search, status, startDate, endDate, sortOrder]);

    const loadDropdownData = useCallback(async () => {
        try {
            const [warehouseResponse, productResponse] = await Promise.all([
                api.get("/warehouse", { params: { limit: 100 } }),
                api.get("/product", { params: { limit: 100 } }),
            ]);

            setWarehouses(getArray(warehouseResponse));
            setProducts(
                getArray(productResponse).filter(
                    (product) => !product.status || product.status === "ACTIVE"
                )
            );
        } catch (requestError) {
            console.error("Load sales order form data:", requestError);
        }
    }, []);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    useEffect(() => {
        loadDropdownData();
    }, [loadDropdownData]);

    const summary = useMemo(() => ({
        total: Number(pagination.totalRecords || 0),
        draft: orders.filter((item) => item.status === "DRAFT").length,
        confirmed: orders.filter((item) => item.status === "CONFIRMED").length,
        dispatched: orders.filter((item) => item.status === "DISPATCHED").length,
    }), [orders, pagination.totalRecords]);

    const filteredProducts = useMemo(() => {
        const query = productSearch.trim().toLowerCase();
        if (!query) return products;

        return products.filter((product) =>
            `${product.name || ""} ${product.sku || ""}`.toLowerCase().includes(query)
        );
    }, [products, productSearch]);

    const selectedTotal = useMemo(
        () => selectedItems.reduce(
            (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
            0
        ),
        [selectedItems]
    );

    const openCreateModal = async () => {
        setCustomer(EMPTY_CUSTOMER);
        setSelectedItems([]);
        setProductToAdd("");
        setProductSearch("");
        setModalError("");
        setShowCreateModal(true);
        await loadDropdownData();
    };

    const addProduct = () => {
        const product = products.find((item) => String(item.id) === productToAdd);

        if (!product) {
            setModalError("Please select a valid product.");
            return;
        }

        if (selectedItems.some((item) => Number(item.productId) === Number(product.id))) {
            setModalError("This product is already added.");
            return;
        }

        const price = Number(product.price);

        if (!Number.isFinite(price) || price < 0) {
            setModalError("Selected product has an invalid price.");
            return;
        }

        setSelectedItems((current) => [
            ...current,
            {
                productId: product.id,
                name: product.name || `Product #${product.id}`,
                sku: product.sku || "—",
                quantity: 1,
                unitPrice: price,
            },
        ]);

        setProductToAdd("");
        setModalError("");
    };

    const updateItemQuantity = (productId, quantity) => {
        const parsed = Number(quantity);

        setSelectedItems((current) =>
            current.map((item) =>
                Number(item.productId) === Number(productId)
                    ? { ...item, quantity: Number.isInteger(parsed) && parsed > 0 ? parsed : 1 }
                    : item
            )
        );
    };

    const removeProduct = (productId) => {
        setSelectedItems((current) =>
            current.filter((item) => Number(item.productId) !== Number(productId))
        );
    };

    const handleCreateOrder = async (event) => {
        event.preventDefault();
        setModalError("");

        if (!customer.customerName.trim()) {
            setModalError("Customer name is required.");
            return;
        }

        if (!customer.warehouseId) {
            setModalError("Please select a warehouse.");
            return;
        }

        if (!selectedItems.length) {
            setModalError("Add at least one product to create an order.");
            return;
        }

        setCreating(true);

        try {
            const createResponse = await api.post("/salesOrder", {
                warehouseId: Number(customer.warehouseId),
                customerName: customer.customerName.trim(),
                customerEmail: customer.customerEmail.trim() || null,
            });

            const orderId = createResponse.data?.data?.id;

            if (!createResponse.data?.success || !orderId) {
                throw new Error(createResponse.data?.message || "Sales order could not be created.");
            }

            try {
                for (const item of selectedItems) {
                    await api.post(`/salesOrder/${orderId}/items`, {
                        productId: Number(item.productId),
                        quantity: Number(item.quantity),
                        // Controller requires unitPrice; service uses the database product price.
                        unitPrice: Number(item.unitPrice),
                    });
                }
            } catch (itemError) {
                setShowCreateModal(false);
                setNotice(
                    `Order #${orderId} was created as a draft, but a product could not be added: ${getMessage(itemError, "Please open the draft and check its items.")}`
                );
                await loadOrders(true);
                return;
            }

            setShowCreateModal(false);
            setNotice(`Sales order #${orderId} created successfully.`);
            setPage(1);
            await loadOrders(true);
        } catch (requestError) {
            setModalError(getMessage(requestError, "Could not create sales order."));
        } finally {
            setCreating(false);
        }
    };

    const openOrderDetails = async (order) => {
        setSelectedOrder(order);
        setOrderItems([]);
        setDetailsLoading(true);

        try {
            const [orderResponse, itemsResponse] = await Promise.all([
                api.get(`/salesOrder/${order.id}`),
                api.get(`/salesOrder/${order.id}/items`),
            ]);

            setSelectedOrder(orderResponse.data?.data || order);
            setOrderItems(Array.isArray(itemsResponse.data?.data) ? itemsResponse.data.data : []);
        } catch (requestError) {
            setNotice(getMessage(requestError, "Could not load complete order details."));
        } finally {
            setDetailsLoading(false);
        }
    };

    const updateOrderStatus = async (order, nextStatus) => {
        const labels = {
            CONFIRMED: "confirm",
            CANCELLED: "cancel",
            DISPATCHED: "dispatch",
        };

        const confirmation = {
            CONFIRMED: "Confirm this sales order?",
            CANCELLED: "Cancel this sales order?",
            DISPATCHED: "Dispatch this order? Stock will be deducted from the warehouse.",
        };

        if (!window.confirm(confirmation[nextStatus])) return;

        setActionBusy(true);
        setNotice("");

        try {
            if (nextStatus === "DISPATCHED") {
                await api.post(`/salesOrder/${order.id}`);
            } else {
                await api.patch(`/salesOrder/${order.id}`, { status: nextStatus });
            }

            setNotice(`Sales order #${order.id} ${labels[nextStatus]}ed successfully.`);
            await loadOrders(true);

            if (selectedOrder?.id === order.id) {
                await openOrderDetails({ ...order, status: nextStatus });
            }
        } catch (requestError) {
            setNotice(getMessage(requestError, "Unable to update this order."));
        } finally {
            setActionBusy(false);
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatus("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const totalPages = Number(pagination.totalPages || 0);

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
            {/* Page heading */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                        Order management
                    </p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                        Sales Orders
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Create, track and manage customer orders.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadOrders(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <Icon name="refresh" size={15} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                        <Icon name="plus" size={15} />
                        Create sales order
                    </button>
                </div>
            </section>

            {/* Notifications */}
            {notice && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs text-blue-800">
                    <p>{notice}</p>
                    <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
                        <Icon name="close" size={15} />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700">
                    <span>{error}</span>
                    <button type="button" onClick={() => loadOrders()} className="font-semibold underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Summary */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <SummaryCard title="All orders" value={summary.total} note="Total matching records" icon="package" tone="blue" />
                <SummaryCard title="Draft orders" value={summary.draft} note="On the current page" icon="calendar" tone="slate" />
                <SummaryCard title="Confirmed" value={summary.confirmed} note="On the current page" icon="check" tone="amber" />
                <SummaryCard title="Dispatched" value={summary.dispatched} note="On the current page" icon="truck" tone="green" />
            </section>

            {/* Filters */}
            <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Icon name="filter" size={15} />
                    Filters
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_auto]">
                    <div className="relative">
                        <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                            placeholder="Search order or customer..."
                            className={`${inputClass} pl-9`}
                        />
                    </div>

                    <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={inputClass}>
                        <option value="">All statuses</option>
                        {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>

                    <input
                        type="date"
                        value={startDate}
                        onChange={(event) => { setStartDate(event.target.value); setPage(1); }}
                        className={inputClass}
                        aria-label="Start date"
                    />

                    <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => { setEndDate(event.target.value); setPage(1); }}
                        className={inputClass}
                        aria-label="End date"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setSortOrder((current) => current === "DESC" ? "ASC" : "DESC")}
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Date: {sortOrder === "DESC" ? "Newest" : "Oldest"}
                        </button>
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </section>

            {/* Orders table */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">All sales orders</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                            {pagination.totalRecords || 0} matching orders
                        </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                        Showing {orders.length} of {pagination.totalRecords || 0}
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-3 p-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <Icon name="package" size={22} />
                        </div>
                        <h3 className="mt-3 text-sm font-bold text-slate-800">No sales orders found</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Create a new order or change your filters.
                        </p>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            <Icon name="plus" size={14} /> Create order
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Warehouse</th>
                                    <th className="px-4 py-3 text-center">Items</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const items = Array.isArray(order.items) ? order.items : [];
                                    const total = order.totalAmount ?? items.reduce(
                                        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
                                        0
                                    );

                                    return (
                                        <tr key={order.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-slate-900">SO-{String(order.id).padStart(4, "0")}</p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">#{order.id}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">{order.customerName}</p>
                                                <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">{order.customerEmail || "No email"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs text-slate-700">{order.warehouse?.name || `Warehouse #${order.warehouseId}`}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                                                {items.length || order.itemCount || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs font-bold tabular-nums text-slate-900">
                                                {currency(total)}
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                                            <td className="px-4 py-3 text-[11px] text-slate-500">{formatDate(order.createdAt)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openOrderDetails(order)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <Icon name="eye" size={14} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] text-slate-500">
                        Page {pagination.page || page} of {totalPages || 1}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            disabled={!totalPages || page >= totalPages || loading}
                            onClick={() => setPage((current) => current + 1)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {/* Create sales order modal */}
            {showCreateModal && (
                <Modal
                    title="Create sales order"
                    subtitle="Add customer details and products to create a draft order."
                    onClose={() => !creating && setShowCreateModal(false)}
                    wide
                >
                    <form onSubmit={handleCreateOrder} className="space-y-4 p-4 sm:p-5">
                        {modalError && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                                {modalError}
                            </div>
                        )}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Customer name" required>
                                <input
                                    required
                                    maxLength={255}
                                    value={customer.customerName}
                                    onChange={(event) => setCustomer((current) => ({ ...current, customerName: event.target.value }))}
                                    placeholder="Enter customer name"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Customer email">
                                <input
                                    type="email"
                                    value={customer.customerEmail}
                                    onChange={(event) => setCustomer((current) => ({ ...current, customerEmail: event.target.value }))}
                                    placeholder="customer@example.com"
                                    className={inputClass}
                                />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Warehouse" required>
                                    <select
                                        required
                                        value={customer.warehouseId}
                                        onChange={(event) => setCustomer((current) => ({ ...current, warehouseId: event.target.value }))}
                                        className={inputClass}
                                    >
                                        <option value="">Select warehouse</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name} {warehouse.location ? `— ${warehouse.location}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    {warehouses.length === 0 && (
                                        <p className="mt-1 text-[10px] text-amber-700">
                                            No warehouses loaded. Check warehouse API access.
                                        </p>
                                    )}
                                </Field>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900">Order products</h3>
                                    <p className="mt-0.5 text-[10px] text-slate-500">Product price is taken from your product database.</p>
                                </div>
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                                    {selectedItems.length} added
                                </span>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                <div className="relative">
                                    <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={productSearch}
                                        onChange={(event) => setProductSearch(event.target.value)}
                                        placeholder="Search product by name or SKU..."
                                        className={`${inputClass} pl-8`}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={productToAdd}
                                        onChange={(event) => setProductToAdd(event.target.value)}
                                        className={`${inputClass} min-w-0 sm:w-56`}
                                    >
                                        <option value="">Select product</option>
                                        {filteredProducts.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} · {currency(product.price)}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={addProduct}
                                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                                    >
                                        <Icon name="plus" size={14} /> Add
                                    </button>
                                </div>
                            </div>

                            {selectedItems.length === 0 ? (
                                <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center">
                                    <Icon name="package" size={22} className="mx-auto text-slate-400" />
                                    <p className="mt-2 text-xs font-semibold text-slate-600">No products added yet</p>
                                    <p className="mt-1 text-[10px] text-slate-400">Select a product above to add it to this order.</p>
                                </div>
                            ) : (
                                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full min-w-[540px] text-left">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2.5">Product</th>
                                                <th className="px-3 py-2.5 text-right">Unit price</th>
                                                <th className="px-3 py-2.5 text-center">Quantity</th>
                                                <th className="px-3 py-2.5 text-right">Subtotal</th>
                                                <th className="px-3 py-2.5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedItems.map((item) => (
                                                <tr key={item.productId}>
                                                    <td className="px-3 py-2.5">
                                                        <p className="text-xs font-semibold text-slate-800">{item.name}</p>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">{item.sku}</p>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-xs text-slate-600">{currency(item.unitPrice)}</td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            onChange={(event) => updateItemQuantity(item.productId, event.target.value)}
                                                            className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-800">
                                                        {currency(item.quantity * item.unitPrice)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(item.productId)}
                                                            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                            aria-label={`Remove ${item.name}`}
                                                        >
                                                            <Icon name="trash" size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-3">
                                <span className="text-xs font-semibold text-slate-600">Estimated order total</span>
                                <span className="text-base font-bold tabular-nums text-slate-900">{currency(selectedTotal)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={creating}
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !warehouses.length || !selectedItems.length}
                                className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {creating ? "Creating order..." : "Create draft order"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Order details modal */}
            {selectedOrder && (
                <Modal
                    title={`Sales order SO-${String(selectedOrder.id).padStart(4, "0")}`}
                    subtitle="Order details, items and available actions."
                    onClose={() => setSelectedOrder(null)}
                    wide
                >
                    <div className="space-y-4 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <StatusBadge status={selectedOrder.status} />
                            <span className="text-[11px] text-slate-500">
                                Created {formatDate(selectedOrder.createdAt)}
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                                <p className="mt-1 text-xs font-bold text-slate-800">{selectedOrder.customerName}</p>
                                <p className="mt-1 break-all text-[10px] text-slate-500">{selectedOrder.customerEmail || "No email"}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Warehouse</p>
                                <p className="mt-1 text-xs font-bold text-slate-800">
                                    {selectedOrder.warehouse?.name || `Warehouse #${selectedOrder.warehouseId}`}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Order total</p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                    {currency(selectedOrder.totalAmount ?? orderItems.reduce(
                                        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
                                        0
                                    ))}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-2 text-xs font-bold text-slate-800">Order items</h3>
                            {detailsLoading ? (
                                <div className="space-y-2">
                                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                                    <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                                </div>
                            ) : orderItems.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-7 text-center text-xs text-slate-500">
                                    No items found for this order.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-200">
                                    <table className="w-full min-w-[480px] text-left">
                                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2.5">Product</th>
                                                <th className="px-3 py-2.5 text-right">Unit price</th>
                                                <th className="px-3 py-2.5 text-center">Qty</th>
                                                <th className="px-3 py-2.5 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orderItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-2.5">
                                                        <p className="text-xs font-semibold text-slate-800">
                                                            {item.product?.name || `Product #${item.productId}`}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">{item.product?.sku || "—"}</p>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right text-xs text-slate-600">{currency(item.unitPrice)}</td>
                                                    <td className="px-3 py-2.5 text-center text-xs text-slate-700">{item.quantity}</td>
                                                    <td className="px-3 py-2.5 text-right text-xs font-bold text-slate-800">
                                                        {currency(Number(item.quantity) * Number(item.unitPrice))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                            {selectedOrder.status === "DRAFT" && (
                                <>
                                    <button
                                        type="button"
                                        disabled={actionBusy}
                                        onClick={() => updateOrderStatus(selectedOrder, "CANCELLED")}
                                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                        Cancel order
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionBusy || detailsLoading || orderItems.length === 0}
                                        onClick={() => updateOrderStatus(selectedOrder, "CONFIRMED")}
                                        className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {actionBusy ? "Please wait..." : "Confirm order"}
                                    </button>
                                </>
                            )}

                            {selectedOrder.status === "CONFIRMED" && (
                                <>
                                    <button
                                        type="button"
                                        disabled={actionBusy}
                                        onClick={() => updateOrderStatus(selectedOrder, "CANCELLED")}
                                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                        Cancel order
                                    </button>
                                    <button
                                        type="button"
                                        disabled={actionBusy || detailsLoading || orderItems.length === 0}
                                        onClick={() => updateOrderStatus(selectedOrder, "DISPATCHED")}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        <Icon name="truck" size={14} />
                                        {actionBusy ? "Dispatching..." : "Dispatch order"}
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setPrintDoc({
                                        type: "INVOICE",
                                        order: { ...selectedOrder, items: orderItems },
                                    })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                            >
                                🖨️ Tax Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setPrintDoc({
                                        type: "PACKING_SLIP",
                                        order: { ...selectedOrder, items: orderItems },
                                    })
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                📦 Packing Slip
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedOrder(null)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Printable Document Modal (Invoice / Packing Slip) */}
            <PrintableDocumentModal
                isOpen={Boolean(printDoc)}
                onClose={() => setPrintDoc(null)}
                type={printDoc?.type}
                order={printDoc?.order}
            />
        </div>
    );
}

export default function SalesOrdersPage() {
    return (
        <AuthGuard allowedRoles={[1, 4, 5]}>
            <SalesOrdersContent />
        </AuthGuard>
    );
}