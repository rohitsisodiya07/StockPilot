"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

const EMPTY_FORM = { name: "", location: "", address: "" };

function Icon({ name, size = 20, className = "" }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className,
        "aria-hidden": true,
    };

    const paths = {
        warehouse: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7M3 10h18" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
        pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
        edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
        eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        building: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3" /></>,
        arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
    };

    return <svg {...common}>{paths[name] || paths.warehouse}</svg>;
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function WarehouseFormModal({ mode, initialData, onClose, onSave, saving }) {
    const [form, setForm] = useState(initialData || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(initialData || EMPTY_FORM);
        setFormError("");
    }, [initialData]);

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setFormError("");

        const payload = {
            name: form.name.trim(),
            location: form.location.trim(),
            address: form.address.trim(),
        };

        if (!payload.name || !payload.location || !payload.address) {
            setFormError("Please complete all required fields.");
            return;
        }

        if (payload.name.length < 2) {
            setFormError("Warehouse name must contain at least 2 characters.");
            return;
        }

        const result = await onSave(payload);
        if (!result?.success) setFormError(result?.message || "Unable to save warehouse.");
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
            <div role="dialog" aria-modal="true" aria-labelledby="warehouse-modal-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl">
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-6 sm:px-8">
                    <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-blue-100/70 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <Icon name={mode === "edit" ? "edit" : "warehouse"} size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{mode === "edit" ? "Update details" : "New location"}</p>
                                <h2 id="warehouse-modal-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{mode === "edit" ? "Edit warehouse" : "Add warehouse"}</h2>
                                <p className="mt-1 text-base text-slate-500">Enter the core details for this warehouse.</p>
                            </div>
                        </div>
                        <button type="button" onClick={onClose} disabled={saving} aria-label="Close modal" className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-50">
                            <Icon name="close" />
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5 px-6 py-6 sm:px-8">
                    {formError && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><Icon name="alert" size={18} /><span>{formError}</span></div>}
                    <div>
                        <label htmlFor="warehouse-name" className="mb-2 block text-sm font-semibold text-slate-700">Warehouse name <span className="text-rose-500">*</span></label>
                        <input id="warehouse-name" name="name" value={form.name} onChange={updateField} required minLength={2} maxLength={255} autoFocus placeholder="e.g. Jaipur Central Warehouse" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                    </div>
                    <div>
                        <label htmlFor="warehouse-location" className="mb-2 block text-sm font-semibold text-slate-700">Location <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Icon name="pin" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input id="warehouse-location" name="location" value={form.location} onChange={updateField} required placeholder="City, region or area" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="warehouse-address" className="mb-2 block text-sm font-semibold text-slate-700">Full address <span className="text-rose-500">*</span></label>
                        <textarea id="warehouse-address" name="address" value={form.address} onChange={updateField} required rows={3} placeholder="Building, street, area and postal code" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Saving...</> : <><Icon name="check" size={18} /> {mode === "edit" ? "Save changes" : "Create warehouse"}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function WarehouseDetailsModal({ warehouse, onClose, onEdit, canEdit }) {
    if (!warehouse) return null;

    const createdAt = warehouse.createdAt ? new Date(warehouse.createdAt) : null;
    const validCreatedAt = createdAt && !Number.isNaN(createdAt.getTime());

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-labelledby="warehouse-details-title" className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-7 text-white sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15"><Icon name="warehouse" size={28} /></div>
                            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Warehouse profile</p><h2 id="warehouse-details-title" className="mt-1 text-2xl font-bold">{warehouse.name}</h2><p className="mt-1 text-sm text-blue-100">Warehouse ID · #{warehouse.id}</p></div>
                        </div>
                        <button onClick={onClose} aria-label="Close details" className="rounded-xl p-2 text-white/80 transition hover:bg-white/10 hover:text-white"><Icon name="close" /></button>
                    </div>
                </div>
                <div className="space-y-4 p-6 sm:p-8">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon name="pin" size={16} /> Location</div><p className="mt-2 font-semibold text-slate-900">{warehouse.location || "—"}</p></div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon name="map" size={16} /> Full address</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{warehouse.address || "—"}</p></div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon name="building" size={16} /> Created</div><p className="mt-2 text-sm font-medium text-slate-900">{validCreatedAt ? createdAt.toLocaleString() : "Creation date unavailable"}</p></div>
                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
                        {canEdit && <button onClick={() => onEdit(warehouse)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Icon name="edit" size={17} /> Edit warehouse</button>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function WarehouseManagementContent() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pageError, setPageError] = useState("");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState(null);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [roleId, setRoleId] = useState(null);

    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem("stockpilot_user");
            if (storedUser) setRoleId(Number(JSON.parse(storedUser)?.roleId));
        } catch (error) {
            console.error("Unable to read user role:", error);
        }
    }, []);

    const canCreate = roleId === 1 || roleId === 4;
    const canEdit = roleId === 1 || roleId === 4;
    const canDelete = roleId === 1;

    const loadWarehouses = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setPageError("");
        try {
            const response = await api.get("/warehouse");
            if (!response.data?.success) throw new Error(response.data?.message || "Unable to fetch warehouses.");
            const data = response.data?.data;
            setWarehouses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Load warehouses error:", error);
            setPageError(getErrorMessage(error, "Could not load warehouses. Please try again."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadWarehouses();
    }, [loadWarehouses]);

    const filteredWarehouses = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return warehouses;
        return warehouses.filter((warehouse) =>
            [warehouse.name, warehouse.location, warehouse.address, String(warehouse.id)]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [warehouses, search]);

    const showToast = (type, message) => {
        setToast({ type, message });
        if (typeof window !== "undefined") {
            window.setTimeout(() => setToast(null), 3500);
        }
    };

    const openCreate = () => setModal({ mode: "create", warehouse: { ...EMPTY_FORM } });
    const openEdit = (warehouse) => {
        setSelectedWarehouse(null);
        setModal({ mode: "edit", warehouse: { id: warehouse.id, name: warehouse.name || "", location: warehouse.location || "", address: warehouse.address || "" } });
    };

    const saveWarehouse = async (payload) => {
        setSaving(true);
        try {
            if (modal?.mode === "edit") {
                const response = await api.put(`/warehouse/${modal.warehouse.id}`, payload);
                if (!response.data?.success) throw new Error(response.data?.message || "Unable to update warehouse.");
                showToast("success", response.data?.message || "Warehouse updated successfully.");
            } else {
                const response = await api.post("/warehouse", payload);
                if (!response.data?.success) throw new Error(response.data?.message || "Unable to create warehouse.");
                showToast("success", response.data?.message || "Warehouse created successfully.");
            }
            setModal(null);
            await loadWarehouses(true);
            return { success: true };
        } catch (error) {
            console.error("Save warehouse error:", error);
            return { success: false, message: getErrorMessage(error, "Unable to save warehouse.") };
        } finally {
            setSaving(false);
        }
    };

    const deleteWarehouse = async (warehouse) => {
        const confirmed = window.confirm(`Delete "${warehouse.name}"? This will soft-delete the warehouse.`);
        if (!confirmed) return;
        setDeletingId(warehouse.id);
        try {
            const response = await api.delete(`/warehouse/${warehouse.id}`);
            if (!response.data?.success) throw new Error(response.data?.message || "Unable to delete warehouse.");
            showToast("success", response.data?.message || "Warehouse deleted successfully.");
            await loadWarehouses(true);
        } catch (error) {
            console.error("Delete warehouse error:", error);
            showToast("error", getErrorMessage(error, "Unable to delete warehouse."));
        } finally {
            setDeletingId(null);
        }
    };

    const total = warehouses.length;
    const visibleStart = filteredWarehouses.length ? 1 : 0;
    const visibleEnd = filteredWarehouses.length;

    return (
        <div className="mx-auto max-w-[1680px] space-y-8 text-[15px]">
            {toast && <div role="status" className={`fixed right-4 top-20 z-[90] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl sm:right-8 ${toast.type === "success" ? "border-emerald-200 bg-white text-emerald-800" : "border-rose-200 bg-white text-rose-700"}`}><span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toast.type === "success" ? "bg-emerald-50" : "bg-rose-50"}`}><Icon name={toast.type === "success" ? "check" : "alert"} size={16} /></span><span className="pr-2 text-sm font-medium">{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification" className="ml-1 text-slate-400 hover:text-slate-700"><Icon name="close" size={16} /></button></div>}

            <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 px-6 py-7 shadow-sm sm:px-8 sm:py-8">
                <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
                <div className="absolute bottom-0 right-24 h-28 w-28 rounded-full bg-indigo-100/50 blur-2xl" />
                <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm"><span className="h-2 w-2 rounded-full bg-blue-600" /> Operations center</div>
                        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-[42px] lg:text-5xl">Warehouse Management</h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Manage your storage locations in one place. Keep warehouse information accurate and easy to access.</p>
                        <div className="mt-5 flex flex-wrap items-center gap-3 text-base text-slate-500"><span className="inline-flex items-center gap-2"><Icon name="check" size={16} className="text-emerald-600" /> Centralized locations</span><span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" /><span className="inline-flex items-center gap-2"><Icon name="map" size={16} className="text-blue-600" /> Address directory</span></div>
                    </div>
                    <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
                        <button onClick={() => loadWarehouses(true)} disabled={refreshing || loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60"><Icon name="refresh" size={18} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
                        {canCreate && <button onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"><Icon name="plus" size={19} /> Add warehouse <Icon name="arrow" size={17} /></button>}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-base font-medium text-slate-500">Total warehouses</p><p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{loading ? "—" : total}</p><p className="mt-1 text-base text-slate-500">Active records returned by the API</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon name="warehouse" size={24} /></div></div>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-base font-medium text-slate-500">Matching results</p><p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{loading ? "—" : filteredWarehouses.length}</p><p className="mt-1 text-base text-slate-500">Based on your current search</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Icon name="search" size={23} /></div></div>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 xl:col-span-1">
                    <div className="flex items-start justify-between gap-4"><div><p className="text-base font-medium text-slate-500">Access level</p><p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{roleId === 1 ? "Administrator" : roleId === 4 ? "Inventory Manager" : roleId === 5 ? "Warehouse Staff" : "Verifying access"}</p><p className="mt-1 text-base text-slate-500">{canDelete ? "Full warehouse management access" : canCreate ? "Create, view and edit warehouses" : "View warehouse information"}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon name="building" size={23} /></div></div>
                </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div><h2 className="text-xl font-bold tracking-tight text-slate-950">Warehouse directory</h2><p className="mt-1 text-base text-slate-500">Browse, search and manage warehouse details.</p></div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="relative block w-full sm:w-80"><span className="sr-only">Search warehouses</span><Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, location, address..." className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-10 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />{search && <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"><Icon name="close" size={15} /></button>}</label>
                        <span className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"><Icon name="warehouse" size={16} /> {filteredWarehouses.length} records</span>
                    </div>
                </div>

                {pageError && <div className="m-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3 text-sm text-rose-800"><Icon name="alert" size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Unable to load warehouses</p><p className="mt-1">{pageError}</p></div></div><button onClick={() => loadWarehouses()} className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">Try again</button></div>}

                {loading ? (
                    <div className="space-y-4 p-6">{[1, 2, 3, 4].map((item) => <div key={item} className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 p-4"><div className="h-11 w-11 rounded-xl bg-slate-100" /><div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-slate-100" /><div className="h-3 w-1/2 rounded bg-slate-100" /></div><div className="h-8 w-24 rounded-lg bg-slate-100" /></div>)}</div>
                ) : !pageError && filteredWarehouses.length === 0 ? (
                    <div className="px-6 py-16 text-center sm:py-20"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon name={search ? "search" : "warehouse"} size={30} /></div><h3 className="mt-5 text-lg font-bold text-slate-950">{search ? "No matching warehouses" : "No warehouses yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{search ? "Try a different name, location or address." : "Create your first warehouse to start organizing your storage locations."}</p>{search ? <button onClick={() => setSearch("")} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear search</button> : canCreate && <button onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Icon name="plus" size={17} /> Add first warehouse</button>}</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-collapse text-left">
                                <thead><tr className="bg-slate-50/90 text-xs uppercase tracking-[0.12em] text-slate-500"><th className="px-6 py-4 font-bold">Warehouse</th><th className="px-5 py-4 font-bold">Location</th><th className="px-5 py-4 font-bold">Full address</th><th className="px-5 py-4 font-bold">Created</th><th className="px-6 py-4 text-right font-bold">Actions</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredWarehouses.map((warehouse) => {
                                        const created = warehouse.createdAt ? new Date(warehouse.createdAt) : null;
                                        const createdValid = created && !Number.isNaN(created.getTime());
                                        return <tr key={warehouse.id} className="group transition-colors duration-150 hover:bg-blue-50/50">
                                            <td className="px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 transition group-hover:border-blue-200"><Icon name="warehouse" size={21} /></div><div className="min-w-0"><p className="max-w-[260px] truncate text-base font-bold text-slate-900" title={warehouse.name}>{warehouse.name}</p><p className="mt-1 text-sm text-slate-400">ID #{warehouse.id}</p></div></div></td>
                                            <td className="px-5 py-5"><div className="flex max-w-[210px] items-start gap-2 text-base text-slate-700"><Icon name="pin" size={16} className="mt-0.5 shrink-0 text-slate-400" /><span>{warehouse.location || "—"}</span></div></td>
                                            <td className="px-5 py-5"><p className="max-w-[320px] whitespace-normal text-base leading-6 text-slate-600">{warehouse.address || "—"}</p></td>
                                            <td className="px-5 py-5"><span className="text-base text-slate-600">{createdValid ? created.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span></td>
                                            <td className="px-6 py-5"><div className="flex items-center justify-end gap-1.5"><button onClick={() => router.push(`/admin/warehouses/${warehouse.id}`)} title="View warehouse details" aria-label={`View ${warehouse.name}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><Icon name="eye" size={17} /></button>{canEdit && <button onClick={() => openEdit(warehouse)} title="Edit warehouse" aria-label={`Edit ${warehouse.name}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Icon name="edit" size={16} /></button>}{canDelete && <button onClick={() => deleteWarehouse(warehouse)} disabled={deletingId === warehouse.id} title="Delete warehouse" aria-label={`Delete ${warehouse.name}`} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">{deletingId === warehouse.id ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" /> : <Icon name="trash" size={16} />}</button>}</div></td>
                                        </tr>;
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>Showing <span className="font-semibold text-slate-700">{visibleStart}–{visibleEnd}</span> of <span className="font-semibold text-slate-700">{filteredWarehouses.length}</span> matching warehouses</p><p>Data is synced with your StockPilot workspace</p></div>
                    </>
                )}
            </section>

            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Warehouse data is loaded from the secured API.</p><p>Access and available actions depend on your assigned role.</p></div>

            {modal && <WarehouseFormModal key={`${modal.mode}-${modal.warehouse.id || "new"}`} mode={modal.mode} initialData={modal.warehouse} onClose={() => !saving && setModal(null)} onSave={saveWarehouse} saving={saving} />}
            {selectedWarehouse && <WarehouseDetailsModal warehouse={selectedWarehouse} onClose={() => setSelectedWarehouse(null)} onEdit={openEdit} canEdit={canEdit} />}
        </div>
    );
}

export default function WarehousesPage() {
    return (
        <AuthGuard allowedRoles={[1, 4, 5]}>
            <AdminLayout>
                <WarehouseManagementContent />
            </AdminLayout>
        </AuthGuard>
    );
}
