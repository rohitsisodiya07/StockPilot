
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";
import { exportToCsv } from "@/Utils/csvHelper";
import BulkProductImportModal from "@/components/products/BulkProductImportModal";

const EMPTY_FORM = {
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    price: "",
    status: "ACTIVE",
};

function ProductModal({
    mode,
    product,
    categories,
    saving,
    onClose,
    onSave,
}) {
    const [form, setForm] = useState(product || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(product || EMPTY_FORM);
        setFormError("");
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        const payload = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            description: form.description.trim() || null,
            price: Number(form.price),
            status: form.status,
        };

        if (payload.name.length < 2) {
            return setFormError("Product name must be at least 2 characters.");
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(payload.sku)) {
            return setFormError("Enter a valid SKU.");
        }

        if (!Number.isFinite(payload.price) || payload.price < 0) {
            return setFormError("Enter a valid product price.");
        }

        try {
            await onSave(payload);
        } catch (error) {
            setFormError(
                error.response?.data?.message || error.message || "Unable to save product."
            );
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
        >
            <div className="my-6 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-100 p-5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">
                            {mode === "create" ? "Add Product" : "Edit Product"}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Manage product catalog information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-5">
                    {formError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-gray-700">
                            Product Name *
                            <input
                                name="name"
                                value={form.name || ""}
                                onChange={handleChange}
                                required
                                minLength={2}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                                placeholder="Product name"
                            />
                        </label>

                        <label className="text-xs font-semibold text-gray-700">
                            SKU *
                            <input
                                name="sku"
                                value={form.sku || ""}
                                onChange={handleChange}
                                required
                                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                                placeholder="SKU-001"
                            />
                        </label>

                        <label className="text-xs font-semibold text-gray-700">
                            Category
                            <select
                                name="categoryId"
                                value={form.categoryId ?? ""}
                                onChange={handleChange}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                            >
                                <option value="">No Category</option>
                                {categories
                                    .filter(
                                        (c) =>
                                            String(c.status || "ACTIVE").toUpperCase() === "ACTIVE"
                                    )
                                    .map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                            </select>
                        </label>

                        <label className="text-xs font-semibold text-gray-700">
                            Price *
                            <input
                                type="number"
                                name="price"
                                value={form.price ?? ""}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </label>

                        <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                            Status
                            <select
                                name="status"
                                value={form.status || "ACTIVE"}
                                onChange={handleChange}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </label>

                        <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                            Description
                            <textarea
                                name="description"
                                value={form.description || ""}
                                onChange={handleChange}
                                rows={3}
                                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-blue-500"
                                placeholder="Product description..."
                            />
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving
                                ? "Saving..."
                                : mode === "create"
                                    ? "Create Product"
                                    : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProductManagementContent() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modal, setModal] = useState(null);
    const [showBulkImport, setShowBulkImport] = useState(false);

    const handleExportCsv = () => {
        exportToCsv("StockPilot_Products", products, [
            { key: "id", label: "Product ID" },
            { key: "name", label: "Product Name" },
            { key: "sku", label: "SKU" },
            { key: "price", label: "Price" },
            { key: "category.name", label: "Category" },
            { key: "status", label: "Status" },
        ]);
    };

    const loadData = useCallback(async (refresh = false) => {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        try {
            const [productResponse, categoryResponse] = await Promise.all([
                api.get("/product"),
                api.get("/category"),
            ]);

            if (!productResponse.data?.success) {
                throw new Error(
                    productResponse.data?.message || "Unable to load products."
                );
            }

            if (!categoryResponse.data?.success) {
                throw new Error(
                    categoryResponse.data?.message || "Unable to load categories."
                );
            }

            setProducts(
                Array.isArray(productResponse.data.data)
                    ? productResponse.data.data
                    : []
            );

            setCategories(
                Array.isArray(categoryResponse.data.data)
                    ? categoryResponse.data.data
                    : []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load product catalog."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const term = search.trim().toLowerCase();

            const matchesSearch =
                !term ||
                [
                    product.name,
                    product.sku,
                    product.description,
                    product.category?.name,
                    product.categoryName,
                    String(product.id),
                ].some((value) => String(value || "").toLowerCase().includes(term));

            const matchesStatus =
                statusFilter === "all" ||
                String(product.status || "ACTIVE").toUpperCase() === statusFilter;

            const matchesCategory =
                categoryFilter === "all" ||
                String(product.categoryId ?? "") === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [products, search, statusFilter, categoryFilter]);

    const saveProduct = async (payload) => {
        setSaving(true);
        setError("");
        setNotice("");

        try {
            if (modal.mode === "create") {
                const response = await api.post("/product", payload);

                if (response.data?.success === false) {
                    throw new Error(response.data.message || "Unable to create product.");
                }

                setNotice("Product created successfully.");
            } else {
                const response = await api.put(
                    `/product/${modal.product.id}`,
                    payload
                );

                if (response.data?.success === false) {
                    throw new Error(response.data.message || "Unable to update product.");
                }

                setNotice("Product updated successfully.");
            }

            setModal(null);
            await loadData(true);
        } finally {
            setSaving(false);
        }
    };

    const deactivateProduct = async (product) => {
        if (!window.confirm(`Deactivate "${product.name}"?`)) return;

        setError("");
        setNotice("");

        try {
            const response = await api.delete(`/product/${product.id}`);

            if (response.data?.success === false) {
                throw new Error(response.data.message || "Unable to deactivate product.");
            }

            setNotice(`"${product.name}" was deactivated.`);
            await loadData(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to deactivate product."
            );
        }
    };

    const activeCount = products.filter(
        (p) => String(p.status || "ACTIVE").toUpperCase() === "ACTIVE"
    ).length;

    const inactiveCount = products.length - activeCount;

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-medium text-blue-600">
                        INVENTORY MANAGEMENT
                    </p>
                    <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                        Products
                    </h1>
                    <p className="mt-1 text-xs text-gray-500">
                        View and manage your product catalog.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleExportCsv}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        title="Export products to CSV"
                    >
                        ↓ Export CSV
                    </button>

                    <button
                        onClick={() => setShowBulkImport(true)}
                        className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-2.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                        title="Bulk import products"
                    >
                        ↑ Bulk Import
                    </button>

                    <button
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {refreshing ? "Refreshing..." : "↻ Refresh"}
                    </button>

                    <button
                        onClick={() =>
                            setModal({ mode: "create", product: EMPTY_FORM })
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                        + Add Product
                    </button>
                </div>
            </div>

            {notice && (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700">
                    {notice}
                    <button onClick={() => setNotice("")}>✕</button>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                    {error}
                    <button onClick={() => setError("")}>✕</button>
                </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                    {
                        label: "Total Products",
                        value: products.length,
                        icon: "📦",
                        color: "text-gray-900",
                    },
                    {
                        label: "Active Products",
                        value: activeCount,
                        icon: "✓",
                        color: "text-green-700",
                    },
                    {
                        label: "Inactive Products",
                        value: inactiveCount,
                        icon: "○",
                        color: "text-gray-600",
                    },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-500">{item.label}</p>
                            <span>{item.icon}</span>
                        </div>
                        <p className={`mt-3 text-2xl font-bold ${item.color}`}>
                            {item.value.toLocaleString("en-IN")}
                        </p>
                    </div>
                ))}
            </div>

            {/* Product List */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product, SKU or category..."
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={String(category.id)}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                        <thead className="bg-gray-50 text-[10px] uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Product</th>
                                <th className="px-4 py-3 font-semibold">SKU</th>
                                <th className="px-4 py-3 font-semibold">Category</th>
                                <th className="px-4 py-3 font-semibold">Price</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-xs text-gray-500">
                                        Loading products...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center">
                                        <p className="text-sm font-semibold text-gray-700">
                                            No products found
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Try changing your search or filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const active =
                                        String(product.status || "ACTIVE").toUpperCase() ===
                                        "ACTIVE";

                                    return (
                                        <tr key={product.id} className="text-xs hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-gray-900">
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 max-w-xs truncate text-[10px] text-gray-500">
                                                    {product.description || `Product ID: ${product.id}`}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 font-mono text-gray-600">
                                                {product.sku}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {product.category?.name ||
                                                    product.categoryName ||
                                                    categories.find(
                                                        (c) =>
                                                            Number(c.id) === Number(product.categoryId)
                                                    )?.name ||
                                                    "Uncategorized"}
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                ₹
                                                {Number(product.price || 0).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${active
                                                            ? "bg-green-50 text-green-700"
                                                            : "bg-gray-100 text-gray-600"
                                                        }`}
                                                >
                                                    {active ? "ACTIVE" : "INACTIVE"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setModal({
                                                                mode: "edit",
                                                                product: {
                                                                    ...EMPTY_FORM,
                                                                    ...product,
                                                                    categoryId: product.categoryId
                                                                        ? String(product.categoryId)
                                                                        : "",
                                                                    price: String(product.price ?? ""),
                                                                },
                                                            })
                                                        }
                                                        title="Edit Product"
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        Edit
                                                    </button>

                                                    {active && (
                                                        <button
                                                            onClick={() => deactivateProduct(product)}
                                                            title="Deactivate Product"
                                                            className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-4 py-3 text-[11px] text-gray-500">
                    <span>
                        Showing {filteredProducts.length} of {products.length} products
                    </span>
                    <span>Product Catalog</span>
                </div>
            </section>

            <BulkProductImportModal
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onSuccess={() => loadData(true)}
            />

            {modal && (
                <ProductModal
                    key={`${modal.mode}-${modal.product?.id || "new"}`}
                    mode={modal.mode}
                    product={modal.product}
                    categories={categories}
                    saving={saving}
                    onClose={() => !saving && setModal(null)}
                    onSave={saveProduct}
                />
            )}
        </div>
    );
}

export default function InventoryManagerProductsPage() {
    return (
        <AuthGuard allowedRoles={[4]}>
            <ProductManagementContent />
        </AuthGuard>
    );
}
