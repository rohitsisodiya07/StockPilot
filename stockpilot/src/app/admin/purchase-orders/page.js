"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import PrintableDocumentModal from "@/components/documents/PrintableDocumentModal";

const BASE = "/purchaseOrder";

const input =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

const primary =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

const secondary =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";

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

function getList(response) {
    const body = response?.data;

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.items)) return body.items;
    if (Array.isArray(body?.data?.items)) return body.data.items;

    return [];
}

function getRecord(response) {
    const body = response?.data;

    return body?.data ?? body?.purchaseOrder ?? body;
}

function StatusBadge({ status }) {
    const styles = {
        DRAFT: "bg-slate-100 text-slate-700",
        ORDERED: "bg-blue-100 text-blue-700",
        RECEIVED: "bg-emerald-100 text-emerald-700",
        CANCELLED: "bg-rose-100 text-rose-700",
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-600"
                }`}
        >
            {status || "UNKNOWN"}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
                {label}
            </span>
            {children}
        </label>
    );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                className={`max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${wide ? "max-w-5xl" : "max-w-xl"
                    }`}
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div>
                        <h2 className="text-xl font-bold text-slate-950">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1 text-sm text-slate-500">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-100"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 sm:p-7">{children}</div>
            </section>
        </div>
    );
}

export default function PurchaseOrderManagementPage() {
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

    const [showCreate, setShowCreate] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [printDoc, setPrintDoc] = useState(null);

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

        const endpoints = [
            { url: "/product", setter: setProducts, label: "Products" },
            { url: "/supplier", setter: setSuppliers, label: "Suppliers" },
            { url: "/warehouse", setter: setWarehouses, label: "Warehouses" },
        ];

        try {
            const results = await Promise.allSettled(
                endpoints.map(async ({ url, setter, label }) => {
                    const response = await api.get(url);
                    const records = getList(response);

                    setter(records);
                    console.log(`${label} loaded:`, records.length);
                })
            );

            results.forEach((result, index) => {
                if (result.status === "rejected") {
                    const { url, label } = endpoints[index];

                    console.error(`Could not load ${label}:`, {
                        url,
                        status: result.reason?.response?.status,
                        message:
                            result.reason?.response?.data?.message ||
                            result.reason?.message,
                    });
                }
            });
        } finally {
            setLookupsLoading(false);
        }
    }, []);
    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: "100",
                offset: "0",
                sortBy: "id",
                sortOrder: "DESC",
            });

            if (search.trim()) params.set("search", search.trim());
            if (statusFilter !== "ALL") params.set("status", statusFilter);

            if (supplierFilter !== "ALL") {
                params.set("supplierId", supplierFilter);
            }

            if (warehouseFilter !== "ALL") {
                params.set("warehouseId", warehouseFilter);
            }

            const response = await api.get(
                `${BASE}?${params.toString()}`
            );

            setOrders(getList(response));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to load purchase orders"
            );
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

        if (!newOrder.supplierId || !newOrder.warehouseId) {
            setError("Please select supplier and warehouse.");
            return;
        }

        setBusy(true);
        setError("");
        setNotice("");

        try {
            const payload = {
                supplierId: Number(newOrder.supplierId),
                warehouseId: Number(newOrder.warehouseId),
                expectedDeliveryDate:
                    newOrder.expectedDeliveryDate || null,
            };

            const response = await api.post(BASE, payload);
            const created = getRecord(response);

            setShowCreate(false);
            resetCreateForm();
            setNotice("Purchase order created successfully.");

            await loadOrders();

            if (created?.id) {
                await openOrder(created.id);
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to create purchase order"
            );
        } finally {
            setBusy(false);
        }
    };

    const openOrder = async (id) => {
        setItemsLoading(true);
        setSelectedOrder(null);
        setOrderItems([]);
        setError("");

        try {
            const [orderResponse, itemsResponse] = await Promise.all([
                api.get(`${BASE}/${id}`),
                api.get(`${BASE}/${id}/items`),
            ]);

            setSelectedOrder(getRecord(orderResponse));
            setOrderItems(getList(itemsResponse));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to load purchase order details"
            );
        } finally {
            setItemsLoading(false);
        }
    };

    const handleAddItem = async (event) => {
        event.preventDefault();

        if (!selectedOrder?.id) return;

        if (!itemDraft.productId || !itemDraft.quantity || !itemDraft.unitPrice) {
            setError("Please fill all item fields.");
            return;
        }

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await api.post(`${BASE}/${selectedOrder.id}/items`, {
                productId: Number(itemDraft.productId),
                quantity: Number(itemDraft.quantity),
                unitPrice: Number(itemDraft.unitPrice),
            });

            setItemDraft({
                productId: "",
                quantity: "1",
                unitPrice: "",
            });

            const response = await api.get(
                `${BASE}/${selectedOrder.id}/items`
            );

            setOrderItems(getList(response));
            setNotice("Item added successfully.");
            await loadOrders();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to add item"
            );
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!selectedOrder?.id) return;

        const confirmed = window.confirm(
            "Are you sure you want to remove this item?"
        );

        if (!confirmed) return;

        setBusy(true);
        setError("");

        try {
            await api.delete(
                `${BASE}/${selectedOrder.id}/items/${itemId}`
            );

            const response = await api.get(
                `${BASE}/${selectedOrder.id}/items`
            );

            setOrderItems(getList(response));
            setNotice("Item removed successfully.");
            await loadOrders();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to remove item"
            );
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

            const response = await api.get(
                `${BASE}/${selectedOrder.id}`
            );

            setSelectedOrder(getRecord(response));
            setEditDate(false);
            setNotice("Delivery date updated successfully.");

            await loadOrders();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to update delivery date"
            );
        } finally {
            setBusy(false);
        }
    };

    const handleStatusChange = async (status) => {
        if (!selectedOrder?.id) return;

        const confirmed = window.confirm(
            `Are you sure you want to ${status.toLowerCase()} this purchase order?`
        );

        if (!confirmed) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await api.patch(`${BASE}/${selectedOrder.id}`, {
                status,
            });

            const response = await api.get(
                `${BASE}/${selectedOrder.id}`
            );

            setSelectedOrder(getRecord(response));
            setNotice(`Purchase order ${status.toLowerCase()} successfully.`);

            await loadOrders();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to update purchase order status"
            );
        } finally {
            setBusy(false);
        }
    };

    const handleReceiveOrder = async () => {
        if (!selectedOrder?.id) return;

        const confirmed = window.confirm(
            "Confirm receiving this purchase order? Inventory will be updated."
        );

        if (!confirmed) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            await api.post(
                `${BASE}/${selectedOrder.id}/receive`
            );

            const response = await api.get(
                `${BASE}/${selectedOrder.id}`
            );

            setSelectedOrder(getRecord(response));
            setNotice("Purchase order received. Inventory updated successfully.");

            await loadOrders();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to receive purchase order"
            );
        } finally {
            setBusy(false);
        }
    };

    const getOrderTotal = (items = []) =>
        items.reduce((total, item) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.unitPrice ?? item.unit_price ?? 0);

            return total + quantity * price;
        }, 0);

    const stats = useMemo(() => {
        return {
            total: orders.length,
            draft: orders.filter((order) => order.status === "DRAFT").length,
            ordered: orders.filter((order) => order.status === "ORDERED").length,
            received: orders.filter((order) => order.status === "RECEIVED").length,
        };
    }, [orders]);

    const getSupplierName = (supplierId) => {
        const supplier = suppliers.find(
            (item) => Number(item.id) === Number(supplierId)
        );

        return supplier?.name || `Supplier #${supplierId}`;
    };

    const getWarehouseName = (warehouseId) => {
        const warehouse = warehouses.find(
            (item) => Number(item.id) === Number(warehouseId)
        );

        return warehouse?.name || `Warehouse #${warehouseId}`;
    };

    const getProductName = (productId) => {
        const product = products.find(
            (item) => Number(item.id) === Number(productId)
        );

        return product?.name || `Product #${productId}`;
    };
    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-semibold text-indigo-600">
                            INVENTORY MANAGEMENT
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                            Purchase Orders
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Create and manage your purchase orders.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setNotice("");
                            setShowCreate(true);
                        }}
                        className={primary}
                    >
                        <span>+</span>
                        Create Purchase Order
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {notice && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <span>{notice}</span>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            className="font-bold"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: "Total Orders",
                            value: stats.total,
                            icon: "📦",
                            color: "bg-indigo-50 text-indigo-700",
                        },
                        {
                            label: "Draft Orders",
                            value: stats.draft,
                            icon: "📝",
                            color: "bg-slate-100 text-slate-700",
                        },
                        {
                            label: "Ordered",
                            value: stats.ordered,
                            icon: "🚚",
                            color: "bg-blue-50 text-blue-700",
                        },
                        {
                            label: "Received",
                            value: stats.received,
                            icon: "✅",
                            color: "bg-emerald-50 text-emerald-700",
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-slate-500">
                                    {stat.label}
                                </p>

                                <span className={`rounded-xl px-3 py-2 ${stat.color}`}>
                                    {stat.icon}
                                </span>
                            </div>

                            <p className="mt-3 text-3xl font-bold text-slate-900">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search purchase orders..."
                            className={input}
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className={input}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ORDERED">Ordered</option>
                            <option value="RECEIVED">Received</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>

                        <select
                            value={supplierFilter}
                            onChange={(event) => setSupplierFilter(event.target.value)}
                            className={input}
                        >
                            <option value="ALL">All Suppliers</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={warehouseFilter}
                            onChange={(event) => setWarehouseFilter(event.target.value)}
                            className={input}
                        >
                            <option value="ALL">All Warehouses</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Orders Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                All Purchase Orders
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                View and manage your orders
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadOrders}
                            disabled={loading}
                            className={secondary}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Order ID</th>
                                    <th className="px-5 py-4">Supplier</th>
                                    <th className="px-5 py-4">Warehouse</th>
                                    <th className="px-5 py-4">Expected Delivery</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                            Loading purchase orders...
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-5 py-12 text-center text-slate-500">
                                            No purchase orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4 font-semibold text-slate-900">
                                                PO-{String(order.id).padStart(4, "0")}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {order.supplier?.name ||
                                                    getSupplierName(order.supplierId ?? order.supplier_id)}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {order.warehouse?.name ||
                                                    getWarehouseName(order.warehouseId ?? order.warehouse_id)}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {formatDate(order.expectedDeliveryDate ?? order.expected_delivery_date)}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={order.status} />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openOrder(order.id)}
                                                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                                                >
                                                    View Details →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Create Purchase Order Modal */}
            {showCreate && (
                <Modal
                    title="Create Purchase Order"
                    subtitle="Select supplier and warehouse to create a draft order."
                    onClose={() => setShowCreate(false)}
                >
                    <form onSubmit={handleCreateOrder} className="space-y-5">
                        <Field label="Supplier">
                            <select
                                required
                                value={newOrder.supplierId}
                                onChange={(event) =>
                                    setNewOrder((prev) => ({
                                        ...prev,
                                        supplierId: event.target.value,
                                    }))
                                }
                                className={input}
                            >
                                <option value="">Select Supplier</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Warehouse">
                            <select
                                required
                                value={newOrder.warehouseId}
                                onChange={(event) =>
                                    setNewOrder((prev) => ({
                                        ...prev,
                                        warehouseId: event.target.value,
                                    }))
                                }
                                className={input}
                            >
                                <option value="">Select Warehouse</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Expected Delivery Date">
                            <input
                                type="date"
                                value={newOrder.expectedDeliveryDate}
                                onChange={(event) =>
                                    setNewOrder((prev) => ({
                                        ...prev,
                                        expectedDeliveryDate: event.target.value,
                                    }))
                                }
                                className={input}
                            />
                        </Field>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className={secondary}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={busy || lookupsLoading}
                                className={primary}
                            >
                                {busy ? "Creating..." : "Create Draft"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <Modal
                    title={`Purchase Order PO-${String(selectedOrder.id).padStart(4, "0")}`}
                    subtitle="Purchase order details and item management."
                    wide
                    onClose={() => {
                        setSelectedOrder(null);
                        setOrderItems([]);
                        setEditDate(false);
                    }}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Supplier
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {selectedOrder.supplier?.name ||
                                        getSupplierName(selectedOrder.supplierId ?? selectedOrder.supplier_id)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Warehouse
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {selectedOrder.warehouse?.name ||
                                        getWarehouseName(selectedOrder.warehouseId ?? selectedOrder.warehouse_id)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Status
                                </p>
                                <div className="mt-2">
                                    <StatusBadge status={selectedOrder.status} />
                                </div>
                            </div>
                        </div>

                        {/* Expected Delivery Date */}
                        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Expected Delivery Date
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {formatDate(selectedOrder.expectedDeliveryDate ?? selectedOrder.expected_delivery_date)}
                                </p>
                            </div>

                            {selectedOrder.status === "DRAFT" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeliveryDate(
                                            String(
                                                selectedOrder.expectedDeliveryDate ??
                                                selectedOrder.expected_delivery_date ??
                                                ""
                                            ).slice(0, 10)
                                        );
                                        setEditDate((prev) => !prev);
                                    }}
                                    className={secondary}
                                >
                                    {editDate ? "Close" : "Edit Date"}
                                </button>
                            )}
                        </div>

                        {editDate && (
                            <form
                                onSubmit={handleUpdateDate}
                                className="flex flex-col gap-3 sm:flex-row"
                            >
                                <input
                                    type="date"
                                    required
                                    value={deliveryDate}
                                    onChange={(event) => setDeliveryDate(event.target.value)}
                                    className={input}
                                />

                                <button
                                    type="submit"
                                    disabled={busy}
                                    className={primary}
                                >
                                    Save Date
                                </button>
                            </form>
                        )}

                        {/* Add Item */}
                        {selectedOrder.status === "DRAFT" && (
                            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                                <h3 className="font-bold text-slate-900">
                                    Add Product to Order
                                </h3>

                                <form
                                    onSubmit={handleAddItem}
                                    className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4"
                                >
                                    <select
                                        required
                                        value={itemDraft.productId}
                                        onChange={(event) => {
                                            const productId = event.target.value;
                                            const product = products.find(
                                                (item) => Number(item.id) === Number(productId)
                                            );

                                            setItemDraft((prev) => ({
                                                ...prev,
                                                productId,
                                                unitPrice: product?.price
                                                    ? String(product.price)
                                                    : prev.unitPrice,
                                            }));
                                        }}
                                        className={input}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        required
                                        value={itemDraft.quantity}
                                        onChange={(event) =>
                                            setItemDraft((prev) => ({
                                                ...prev,
                                                quantity: event.target.value,
                                            }))
                                        }
                                        placeholder="Quantity"
                                        className={input}
                                    />

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={itemDraft.unitPrice}
                                        onChange={(event) =>
                                            setItemDraft((prev) => ({
                                                ...prev,
                                                unitPrice: event.target.value,
                                            }))
                                        }
                                        placeholder="Unit Price"
                                        className={input}
                                    />

                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className={primary}
                                    >
                                        + Add Item
                                    </button>
                                </form>
                            </section>
                        )}

                        {/* Items */}
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">
                                    Order Items
                                </h3>
                                <span className="text-sm text-slate-500">
                                    {orderItems.length} items
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Quantity</th>
                                            <th className="px-4 py-3">Unit Price</th>
                                            <th className="px-4 py-3">Total</th>
                                            {selectedOrder.status === "DRAFT" && (
                                                <th className="px-4 py-3 text-right">Action</th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {itemsLoading ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                    Loading items...
                                                </td>
                                            </tr>
                                        ) : orderItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                                    No items added yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            orderItems.map((item) => {
                                                const quantity = Number(item.quantity || 0);
                                                const price = Number(item.unitPrice ?? item.unit_price ?? 0);

                                                return (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-3 font-medium text-slate-800">
                                                            {item.product?.name ||
                                                                getProductName(item.productId ?? item.product_id)}
                                                        </td>

                                                        <td className="px-4 py-3 text-slate-600">
                                                            {quantity}
                                                        </td>

                                                        <td className="px-4 py-3 text-slate-600">
                                                            {currency(price)}
                                                        </td>

                                                        <td className="px-4 py-3 font-semibold text-slate-900">
                                                            {currency(quantity * price)}
                                                        </td>

                                                        {selectedOrder.status === "DRAFT" && (
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    disabled={busy}
                                                                    className="font-semibold text-rose-600 hover:text-rose-800"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>

                                    <tfoot className="bg-slate-50">
                                        <tr>
                                            <td
                                                colSpan={selectedOrder.status === "DRAFT" ? 3 : 3}
                                                className="px-4 py-4 text-right font-bold text-slate-700"
                                            >
                                                Order Total
                                            </td>
                                            <td className="px-4 py-4 font-bold text-slate-900">
                                                {currency(getOrderTotal(orderItems))}
                                            </td>
                                            {selectedOrder.status === "DRAFT" && <td />}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                            {selectedOrder.status === "DRAFT" && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange("CANCELLED")}
                                        disabled={busy}
                                        className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                    >
                                        Cancel Order
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleStatusChange("ORDERED")}
                                        disabled={busy || orderItems.length === 0}
                                        className={primary}
                                    >
                                        {busy ? "Please wait..." : "Place Order"}
                                    </button>
                                </>
                            )}

                            {selectedOrder.status === "ORDERED" && (
                                <button
                                    type="button"
                                    onClick={handleReceiveOrder}
                                    disabled={busy}
                                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {busy ? "Processing..." : "Receive Order"}
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setPrintDoc({
                                        type: "GRN",
                                        order: { ...selectedOrder, items: orderItems },
                                    })
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                            >
                                📋 Print Goods Received Note (GRN)
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedOrder(null);
                                    setOrderItems([]);
                                }}
                                className={secondary}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Printable Document Modal */}
            <PrintableDocumentModal
                isOpen={Boolean(printDoc)}
                onClose={() => setPrintDoc(null)}
                type="GRN"
                order={printDoc?.order}
            />

        </main>
    );
}