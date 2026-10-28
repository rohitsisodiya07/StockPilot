"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import {
    Building2, CheckCircle2, ChevronDown, Edit3, Loader2, Mail,
    MapPin, Phone, Plus, RefreshCw, Search, ShieldAlert, Trash2, X,
} from "lucide-react";

const PAGE_SIZE = 10;
const EMPTY_FORM = { name: "", email: "", phone: "", address: "", status: "ACTIVE" };

function rowsFromResponse(response) {
    const body = response?.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    return [];
}

function errorText(error, fallback = "Something went wrong.") {
    return error?.response?.data?.message || error?.message || fallback;
}

function SupplierStatus({ status }) {
    const active = String(status || "").toUpperCase() === "ACTIVE";
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function SupplierPageContent() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("DESC");
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const loadSuppliers = useCallback(async (refresh = false) => {
        setError("");
        refresh ? setRefreshing(true) : setLoading(true);
        try {
            // Fetch all active/inactive suppliers, then filter and paginate in the UI.
            // Backend caps limit at 100, so request the maximum supported page size.
            const response = await api.get("/supplier", {
                params: { limit: 100, offset: 0, sortBy, sortOrder },
            });
            setSuppliers(rowsFromResponse(response));
        } catch (err) {
            setError(errorText(err, "Unable to load suppliers."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sortBy, sortOrder]);

    useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

    const filteredSuppliers = useMemo(() => {
        const q = search.trim().toLowerCase();
        return suppliers.filter((supplier) => {
            const matchesSearch = !q || [supplier.name, supplier.email, supplier.phone, supplier.address]
                .some((value) => String(value || "").toLowerCase().includes(q));
            const status = String(supplier.status || "ACTIVE").toUpperCase();
            const matchesStatus = statusFilter === "all" || status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [suppliers, search, statusFilter]);

    useEffect(() => { setPage(1); }, [search, statusFilter, sortBy, sortOrder]);

    const activeCount = suppliers.filter((s) => String(s.status).toUpperCase() === "ACTIVE").length;
    const inactiveCount = suppliers.length - activeCount;
    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const visibleRows = filteredSuppliers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const startCreate = () => {
        setEditingSupplier(null);
        setForm(EMPTY_FORM);
        setError("");
        setNotice("");
        setModalOpen(true);
    };

    const startEdit = (supplier) => {
        setEditingSupplier(supplier);
        setForm({
            name: supplier.name || "",
            email: supplier.email || "",
            phone: supplier.phone || "",
            address: supplier.address || "",
            status: supplier.status || "ACTIVE",
        });
        setError("");
        setNotice("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!saving) setModalOpen(false);
    };

    const onChange = (event) => {
        const { name, value } = event.target;
        setForm((old) => ({ ...old, [name]: value }));
    };

    const submitForm = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        const payload = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            ...(editingSupplier ? { status: form.status } : {}),
        };

        if (payload.name.length < 2 || payload.name.length > 150) {
            setError("Supplier name must be 2–150 characters."); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) {
            setError("Enter a valid email address."); return;
        }
        if (!/^[+]?[-\d\s()]{7,20}$/.test(payload.phone)) {
            setError("Enter a valid phone number (7–20 characters)."); return;
        }
        if (!payload.address) { setError("Supplier address is required."); return; }
        if (payload.address.length > 2000) { setError("Address must be at most 2000 characters."); return; }

        setSaving(true);
        try {
            if (editingSupplier) {
                await api.put(`/supplier/${editingSupplier.id}`, payload);
                setNotice("Supplier updated successfully.");
            } else {
                await api.post("/supplier", payload);
                setNotice("Supplier created successfully.");
            }
            setModalOpen(false);
            await loadSuppliers(true);
        } catch (err) {
            setError(errorText(err, "Unable to save supplier."));
        } finally {
            setSaving(false);
        }
    };

    const deactivateSupplier = async (supplier) => {
        if (String(supplier.status).toUpperCase() === "INACTIVE") return;
        if (!window.confirm(`Deactivate supplier "${supplier.name}"? It will remain in records but be marked inactive.`)) return;
        setError(""); setNotice("");
        try {
            await api.delete(`/supplier/${supplier.id}`);
            setNotice("Supplier deactivated successfully.");
            await loadSuppliers(true);
        } catch (err) {
            setError(errorText(err, "Unable to deactivate supplier."));
        }
    };

    return (
        <AdminLayout>
            <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-medium text-indigo-600">StockPilot / Procurement</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Supplier Management</h1>
                            <p className="mt-2 text-sm text-slate-500">Manage supplier contact details and account status.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => loadSuppliers(true)} disabled={refreshing || loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
                            </button>
                            <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
                                <Plus className="h-4 w-4" /> Add Supplier
                            </button>
                        </div>
                    </header>

                    {error && !modalOpen && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><ShieldAlert className="h-5 w-5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}
                    {notice && !modalOpen && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" /><span className="flex-1">{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SummaryCard title="Total suppliers" value={suppliers.length} helper="Supplier records loaded" icon={Building2} tone="indigo" />
                        <SummaryCard title="Active suppliers" value={activeCount} helper="Available for procurement" icon={CheckCircle2} tone="emerald" />
                        <SummaryCard title="Inactive suppliers" value={inactiveCount} helper="Deactivated records" icon={ShieldAlert} tone="slate" />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <label className="relative block md:col-span-1">
                                <span className="sr-only">Search suppliers</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, address..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                            </label>
                            <label className="relative block">
                                <span className="sr-only">Filter status</span>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                                    <option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                                </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <label><span className="sr-only">Sort by</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="createdAt">Created date</option><option value="name">Supplier name</option><option value="updatedAt">Updated date</option></select></label>
                                <label><span className="sr-only">Sort order</span><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="DESC">Newest first</option><option value="ASC">Oldest first</option></select></label>
                            </div>
                        </div>
                        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">Showing <span className="font-semibold text-slate-800">{filteredSuppliers.length ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(safePage * PAGE_SIZE, filteredSuppliers.length)}</span> of <span className="font-semibold text-slate-800">{filteredSuppliers.length}</span> suppliers</p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
                                    <th className="px-5 py-4 font-semibold">Supplier</th><th className="px-5 py-4 font-semibold">Contact</th><th className="px-5 py-4 font-semibold">Address</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 text-right font-semibold">Actions</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading suppliers...</span></td></tr> : visibleRows.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center"><Building2 className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No suppliers found</p><p className="mt-1 text-sm text-slate-500">Try another search or add a supplier.</p><button onClick={startCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add Supplier</button></td></tr> : visibleRows.map((supplier) => (
                                        <tr key={supplier.id} className="hover:bg-slate-50/80">
                                            <td className="px-5 py-4"><div className="font-semibold text-slate-900">{supplier.name}</div><div className="mt-1 text-xs text-slate-500">Supplier ID: {supplier.id}</div></td>
                                            <td className="px-5 py-4"><div className="flex items-center gap-2 text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" />{supplier.email || "—"}</div><div className="mt-1.5 flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{supplier.phone || "—"}</div></td>
                                            <td className="max-w-xs px-5 py-4"><div className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="line-clamp-2">{supplier.address || "—"}</span></div></td>
                                            <td className="px-5 py-4"><SupplierStatus status={supplier.status} /></td>
                                            <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => startEdit(supplier)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Edit3 className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => deactivateSupplier(supplier)} disabled={String(supplier.status).toUpperCase() === "INACTIVE"} title="Deactivate supplier" className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!loading && filteredSuppliers.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-slate-500">Page {safePage} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Previous</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Next</button></div></div>}
                    </section>
                    <p className="text-xs text-slate-500">Deactivation is a soft delete: supplier records remain stored and their status changes to INACTIVE.</p>
                </div>
            </main>

            {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title" className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="supplier-modal-title" className="text-lg font-bold text-slate-900">{editingSupplier ? "Edit Supplier" : "Add Supplier"}</h2><p className="mt-1 text-sm text-slate-500">Enter the supplier's contact and address details.</p></div><button onClick={closeModal} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"><X className="h-5 w-5" /></button></div>
                <form onSubmit={submitForm} className="space-y-4 px-6 py-5">
                    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Supplier name <span className="text-red-500">*</span></span><input name="name" value={form.name} onChange={onChange} minLength={2} maxLength={150} required placeholder="e.g. Acme Supplies" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Email <span className="text-red-500">*</span></span><input name="email" type="email" value={form.email} onChange={onChange} maxLength={254} required placeholder="supplier@example.com" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Phone <span className="text-red-500">*</span></span><input name="phone" type="tel" value={form.phone} onChange={onChange} minLength={7} maxLength={20} required placeholder="+91 98765 43210" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                        {editingSupplier && <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Status</span><select name="status" value={form.status} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>}
                    </div>
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Address <span className="text-red-500">*</span></span><textarea name="address" value={form.address} onChange={onChange} maxLength={2000} required rows={3} placeholder="Full supplier address" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingSupplier ? "Save changes" : "Create supplier"}</button></div>
                </form>
            </div></div>}
        </AdminLayout>
    );
}

function SummaryCard({ title, value, helper, icon: Icon, tone }) {
    const toneClass = tone === "emerald" ? "bg-emerald-50 text-emerald-700" : tone === "slate" ? "bg-slate-100 text-slate-700" : "bg-indigo-50 text-indigo-700";
    return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${toneClass}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs text-slate-500">{helper}</p></div>;
}

export default function SupplierPage() {
    return <AuthGuard allowedRoles={[1, 4, 5]}><SupplierPageContent /></AuthGuard>;
}
