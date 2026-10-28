"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

const EMPTY_FORM = { name: "", description: "", status: "ACTIVE" };

function Icon({ name, size = 20, className = "" }) {
    const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", className, "aria-hidden": true };
    const paths = {
        tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r=".8" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    };
    return <svg {...common}>{paths[name] || paths.tag}</svg>;
}

function errorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function CategoryModal({ mode, category, saving, onClose, onSave }) {
    const [form, setForm] = useState(category || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(category || EMPTY_FORM);
        setFormError("");
    }, [category]);

    const submit = async (event) => {
        event.preventDefault();
        setFormError("");
        const payload = { name: form.name.trim(), description: form.description.trim() || null, status: form.status };
        if (payload.name.length < 2) return setFormError("Category name must be at least 2 characters.");
        if (!["ACTIVE", "INACTIVE"].includes(payload.status)) return setFormError("Select a valid status.");
        try {
            await onSave(payload);
        } catch (error) {
            setFormError(errorMessage(error, "Could not save category."));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
            <section className="my-8 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-50 p-3 text-violet-700"><Icon name="tag" size={22} /></div><div><h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "Create category" : "Edit category"}</h2><p className="mt-1 text-sm text-slate-500">Organize products in your catalog.</p></div></div><button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><Icon name="close" /></button></div>
                <form onSubmit={submit} className="space-y-5 p-6">
                    {formError && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><Icon name="alert" size={18} /><span>{formError}</span></div>}
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Category name *</span><input name="name" value={form.name || ""} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required minLength={2} maxLength={100} autoFocus placeholder="e.g. Electronics" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span><textarea value={form.description || ""} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows={4} placeholder="Optional category description" className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span><select value={form.status || "ACTIVE"} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{saving ? "Saving..." : mode === "create" ? "Create category" : "Save changes"}</button></div>
                </form>
            </section>
        </div>
    );
}

function CategoryManagementContent() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modal, setModal] = useState(null);

    const loadCategories = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        setPageError("");
        try {
            const response = await api.get("/category");
            if (!response.data?.success) throw new Error(response.data?.message || "Unable to fetch categories.");
            setCategories(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (error) {
            console.error("Load categories error:", error);
            setPageError(errorMessage(error, "Could not load categories. Check your API and try again."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    const filteredCategories = useMemo(() => categories.filter((category) => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term || [category.name, category.description, String(category.id)].some((value) => String(value || "").toLowerCase().includes(term));
        const matchesStatus = statusFilter === "all" || String(category.status || "ACTIVE").toUpperCase() === statusFilter;
        return matchesSearch && matchesStatus;
    }), [categories, search, statusFilter]);

    const saveCategory = async (payload) => {
        setSaving(true);
        setNotice("");
        try {
            if (modal.mode === "create") {
                const response = await api.post("/category", payload);
                if (response.data?.success === false) throw new Error(response.data.message || "Could not create category.");
                setNotice("Category created successfully.");
            } else {
                const response = await api.put(`/category/${modal.category.id}`, payload);
                if (response.data?.success === false) throw new Error(response.data.message || "Could not update category.");
                setNotice("Category updated successfully.");
            }
            setModal(null);
            await loadCategories(true);
        } finally {
            setSaving(false);
        }
    };

    const deactivateCategory = async (category) => {
        if (!window.confirm(`Deactivate "${category.name}"?`)) return;
        setNotice("");
        try {
            const response = await api.delete(`/category/${category.id}`);
            if (response.data?.success === false) throw new Error(response.data.message || "Could not deactivate category.");
            setNotice(`"${category.name}" was deactivated.`);
            await loadCategories(true);
        } catch (error) {
            setPageError(errorMessage(error, "Could not deactivate category."));
        }
    };

    const activeCount = categories.filter((c) => String(c.status || "ACTIVE").toUpperCase() === "ACTIVE").length;
    const inactiveCount = categories.length - activeCount;

    return (
        <main className="min-h-screen bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"><Icon name="tag" size={14} /> Catalog management</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Category Management</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Create and organize product categories.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => loadCategories(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><Icon name="refresh" size={17} />{refreshing ? "Refreshing..." : "Refresh"}</button><button type="button" onClick={() => setModal({ mode: "create", category: EMPTY_FORM })} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"><Icon name="plus" size={17} />Add category</button></div></div>
                {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>}
                {pageError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{pageError}</span><button type="button" onClick={() => setPageError("")} className="font-bold">×</button></div>}
                <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Total categories</p><p className="mt-2 text-3xl font-bold text-slate-950">{categories.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Active</p><p className="mt-2 text-3xl font-bold text-emerald-700">{activeCount}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Inactive</p><p className="mt-2 text-3xl font-bold text-slate-700">{inactiveCount}</p></div></div>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5"><div className="relative flex-1"><Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by category name, description or ID..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-violet-500"><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 font-semibold">Description</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Created</th><th className="px-5 py-4 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500"><span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />Loading categories...</td></tr> : filteredCategories.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="tag" size={23} /></div><p className="font-semibold text-slate-800">{categories.length ? "No categories match your filters" : "No categories yet"}</p><p className="mt-1 text-sm text-slate-500">{categories.length ? "Try a different search or filter." : "Add your first category to organize products."}</p></td></tr> : filteredCategories.map((category) => <tr key={category.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Icon name="tag" size={19} /></div><div><p className="font-semibold text-slate-900">{category.name}</p><p className="mt-0.5 text-xs text-slate-500">CAT-{String(category.id).padStart(4, "0")}</p></div></div></td><td className="max-w-sm px-5 py-4 text-slate-600"><p className="line-clamp-2">{category.description || "—"}</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${String(category.status || "ACTIVE").toUpperCase() === "ACTIVE" ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"}`}>{String(category.status || "ACTIVE").toUpperCase()}</span></td><td className="px-5 py-4 text-slate-500">{category.createdAt ? new Date(category.createdAt).toLocaleDateString() : "—"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal({ mode: "edit", category: { ...EMPTY_FORM, ...category, description: category.description || "" } })} title="Edit category" aria-label={`Edit ${category.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"><Icon name="edit" size={17} /></button>{String(category.status || "ACTIVE").toUpperCase() !== "INACTIVE" && <button type="button" onClick={() => deactivateCategory(category)} title="Deactivate category" aria-label={`Deactivate ${category.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Icon name="trash" size={17} /></button>}</div></td></tr>)}
                    </tbody></table></div>
                    <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Showing <strong className="text-slate-700">{filteredCategories.length}</strong> of <strong className="text-slate-700">{categories.length}</strong> categories</span><span>Category access is limited by backend role permissions.</span></div>
                </section>
            </div>
            {modal && <CategoryModal key={`${modal.mode}-${modal.category?.id || "new"}`} mode={modal.mode} category={modal.category || EMPTY_FORM} saving={saving} onClose={() => !saving && setModal(null)} onSave={saveCategory} />}
        </main>
    );
}

export default function CategoryPage() {
    return <AuthGuard allowedRoles={[1]}><AdminLayout><CategoryManagementContent /></AdminLayout></AuthGuard>;
}
