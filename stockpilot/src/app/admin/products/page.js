"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

const EMPTY_FORM = {
    name: "",
    sku: "",
    categoryId: "",
    description: "",
    price: "",
    status: "ACTIVE",
};

function Icon({ name, size = 20, className = "" }) {
    const common = {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round",
        strokeLinejoin: "round", className, "aria-hidden": true,
    };
    const paths = {
        package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
        tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r=".8" /></>,
    };
    return <svg {...common}>{paths[name] || paths.package}</svg>;
}

function errorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function ProductModal({ mode, product, categories, saving, onClose, onSave }) {
    const [form, setForm] = useState(product || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(product || EMPTY_FORM);
        setFormError("");
    }, [product]);

    const change = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setFormError("");
        const payload = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            description: form.description.trim() || null,
            price: Number(form.price),
            status: form.status,
        };

        if (payload.name.length < 2) return setFormError("Product name must be at least 2 characters.");
        if (!/^[a-zA-Z0-9_-]+$/.test(payload.sku)) return setFormError("SKU may contain only letters, numbers, underscores and hyphens.");
        if (!Number.isFinite(payload.price) || payload.price < 0) return setFormError("Enter a valid price of zero or more.");
        if (!["ACTIVE", "INACTIVE"].includes(payload.status)) return setFormError("Select a valid status.");

        try {
            await onSave(payload);
        } catch (error) {
            setFormError(errorMessage(error, "Could not save product."));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
            <section className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon name="package" size={22} /></div>
                        <div><h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "Create product" : "Edit product"}</h2><p className="mt-1 text-sm text-slate-500">Manage catalog information and pricing.</p></div>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><Icon name="close" /></button>
                </div>
                <form onSubmit={submit} className="space-y-5 p-6">
                    {formError && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><Icon name="alert" size={18} /><span>{formError}</span></div>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Product name *</span><input name="name" value={form.name || ""} onChange={change} required minLength={2} maxLength={255} placeholder="e.g. Wireless Mouse" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">SKU *</span><input name="sku" value={form.sku || ""} onChange={change} required maxLength={100} pattern="[a-zA-Z0-9_-]+" title="Use letters, numbers, underscore or hyphen" placeholder="e.g. MOU-001" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Category</span><select name="categoryId" value={form.categoryId ?? ""} onChange={change} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"><option value="">No category</option>{categories.filter((c) => String(c.status || "ACTIVE").toUpperCase() === "ACTIVE").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Price *</span><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span><input type="number" name="price" value={form.price ?? ""} onChange={change} required min="0" max="99999999.99" step="0.01" placeholder="0.00" className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></div></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span><select name="status" value={form.status || "ACTIVE"} onChange={change} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
                        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span><textarea name="description" value={form.description || ""} onChange={change} rows={3} placeholder="Optional product description" className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></label>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}</button></div>
                </form>
            </section>
        </div>
    );
}

function ProductManagementContent() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [modal, setModal] = useState(null);

    const loadData = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        setPageError("");
        try {
            const [productResponse, categoryResponse] = await Promise.all([
                api.get("/product"),
                api.get("/category"),
            ]);
            if (!productResponse.data?.success) throw new Error(productResponse.data?.message || "Unable to fetch products.");
            if (!categoryResponse.data?.success) throw new Error(categoryResponse.data?.message || "Unable to fetch categories.");
            setProducts(Array.isArray(productResponse.data.data) ? productResponse.data.data : []);
            setCategories(Array.isArray(categoryResponse.data.data) ? categoryResponse.data.data : []);
        } catch (error) {
            console.error("Load product catalog error:", error);
            setPageError(errorMessage(error, "Could not load products. Check your API and try again."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const filteredProducts = useMemo(() => products.filter((product) => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || [product.name, product.sku, product.description, product.category?.name, product.categoryName, String(product.id)].some((value) => String(value || "").toLowerCase().includes(term));
        const matchesStatus = statusFilter === "all" || String(product.status || "ACTIVE").toUpperCase() === statusFilter;
        const matchesCategory = categoryFilter === "all" || String(product.categoryId ?? "") === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    }), [products, search, statusFilter, categoryFilter]);

    const saveProduct = async (payload) => {
        setSaving(true);
        setNotice("");
        try {
            if (modal.mode === "create") {
                const response = await api.post("/product", payload);
                if (response.data?.success === false) throw new Error(response.data.message || "Could not create product.");
                setNotice("Product created successfully.");
            } else {
                const response = await api.put(`/product/${modal.product.id}`, payload);
                if (response.data?.success === false) throw new Error(response.data.message || "Could not update product.");
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
        setNotice("");
        try {
            const response = await api.delete(`/product/${product.id}`);
            if (response.data?.success === false) throw new Error(response.data.message || "Could not deactivate product.");
            setNotice(`"${product.name}" was deactivated.`);
            await loadData(true);
        } catch (error) {
            setPageError(errorMessage(error, "Could not deactivate product."));
        }
    };

    const activeCount = products.filter((p) => String(p.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
    const inactiveCount = products.length - activeCount;

    return (
        <main className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700"><Icon name="package" size={14} /> Catalog management</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Product Management</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">Manage products, pricing, categories and availability from one place.</p></div>
                    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => loadData(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><Icon name="refresh" size={17} />{refreshing ? "Refreshing..." : "Refresh"}</button><button type="button" onClick={() => setModal({ mode: "create", product: EMPTY_FORM })} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Icon name="plus" size={17} />Add product</button></div>
                </div>

                {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
                {pageError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{pageError}</span><button type="button" onClick={() => setPageError("")} className="font-bold">×</button></div>}

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Total products</p><p className="mt-2 text-3xl font-bold text-slate-950">{products.length}</p><p className="mt-1 text-xs text-slate-500">Catalog records</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Active products</p><p className="mt-2 text-3xl font-bold text-emerald-700">{activeCount}</p><p className="mt-1 text-xs text-slate-500">Available in catalog</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Inactive products</p><p className="mt-2 text-3xl font-bold text-slate-700">{inactiveCount}</p><p className="mt-1 text-xs text-slate-500">Not currently active</p></div>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center">
                        <div className="relative flex-1"><Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product, SKU, category or ID..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></div>
                        <div className="flex flex-col gap-3 sm:flex-row"><select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"><option value="all">All categories</option>{categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500"><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">Product</th><th className="px-5 py-4 font-semibold">SKU</th><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Price</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 text-right font-semibold">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-500"><span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />Loading products...</td></tr> : filteredProducts.length === 0 ? <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="package" size={23} /></div><p className="font-semibold text-slate-800">{products.length ? "No products match your filters" : "No products yet"}</p><p className="mt-1 text-sm text-slate-500">{products.length ? "Try a different search or filter." : "Add your first product to start building the catalog."}</p></td></tr> : filteredProducts.map((product) => <tr key={product.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon name="package" size={19} /></div><div className="min-w-0"><p className="font-semibold text-slate-900">{product.name}</p><p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{product.description || `Product ID: ${product.id}`}</p></div></div></td><td className="px-5 py-4 font-mono text-xs text-slate-600">{product.sku}</td><td className="px-5 py-4 text-slate-600">{product.category?.name || product.categoryName || categories.find((c) => Number(c.id) === Number(product.categoryId))?.name || "Uncategorized"}</td><td className="px-5 py-4 font-semibold tabular-nums text-slate-900">₹{Number(product.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${String(product.status || "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"}`}>{String(product.status || "ACTIVE").toUpperCase()}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal({ mode: "edit", product: { ...EMPTY_FORM, ...product, categoryId: product.categoryId == null ? "" : String(product.categoryId), price: String(product.price ?? ""), description: product.description || "" } })} title="Edit product" aria-label={`Edit ${product.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Icon name="edit" size={17} /></button>{String(product.status || "ACTIVE").toUpperCase() !== "INACTIVE" && <button type="button" onClick={() => deactivateProduct(product)} title="Deactivate product" aria-label={`Deactivate ${product.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Icon name="trash" size={17} /></button>}</div></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Showing <strong className="text-slate-700">{filteredProducts.length}</strong> of <strong className="text-slate-700">{products.length}</strong> products</span><span>Product access is limited by backend role permissions.</span></div>
                </section>
            </div>
            {modal && <ProductModal key={`${modal.mode}-${modal.product?.id || "new"}`} mode={modal.mode} product={modal.product || EMPTY_FORM} categories={categories} saving={saving} onClose={() => !saving && setModal(null)} onSave={saveProduct} />}
        </main>
    );
}

export default function ProductPage() {
    return <AuthGuard allowedRoles={[1]}><AdminLayout><ProductManagementContent /></AdminLayout></AuthGuard>;
}
