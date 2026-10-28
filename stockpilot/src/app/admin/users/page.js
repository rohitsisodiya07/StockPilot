"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

const EMPTY_FORM = { name: "", email: "", password: "", roleId: "5" };
const ROLE_LABELS = { 4: "Inventory Manager", 5: "Warehouse Staff" };

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
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
        shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
        user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    };
    return <svg {...common}>{paths[name] || paths.users}</svg>;
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function UserFormModal({ mode, initialData, onClose, onSave, saving }) {
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
            email: form.email.trim().toLowerCase(),
            roleId: Number(form.roleId),
        };
        if (!payload.name || payload.name.length < 2) {
            setFormError("Name must contain at least 2 characters.");
            return;
        }
        if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            setFormError("Please enter a valid email address.");
            return;
        }
        if (![4, 5].includes(payload.roleId)) {
            setFormError("Select Inventory Manager or Warehouse Staff.");
            return;
        }
        if (mode === "create" && form.password.length < 6) {
            setFormError("Password must be at least 6 characters.");
            return;
        }
        if (form.password) payload.password = form.password;
        try {
            await onSave(payload);
        } catch (error) {
            setFormError(getErrorMessage(error, "Could not save this user."));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
            <section className="my-8 w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon name="user" size={22} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{mode === "create" ? "Create team member" : "Edit team member"}</h2>
                            <p className="mt-1 text-sm text-slate-500">{mode === "create" ? "Add an inventory manager or warehouse staff member." : "Update this user's profile and role."}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Close"><Icon name="close" /></button>
                </div>
                <form onSubmit={submit} className="space-y-5 p-6">
                    {formError && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><Icon name="alert" size={18} className="mt-0.5 shrink-0" /><span>{formError}</span></div>}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Full name <span className="text-rose-500">*</span></span><input name="name" value={form.name} onChange={updateField} required minLength={2} maxLength={255} autoFocus placeholder="e.g. Rahul Sharma" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></label>
                        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Email address <span className="text-rose-500">*</span></span><div className="relative"><Icon name="mail" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" name="email" value={form.email} onChange={updateField} required placeholder="name@company.com" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></div></label>
                        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Role <span className="text-rose-500">*</span></span><select name="roleId" value={form.roleId} onChange={updateField} required className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"><option value="4">Inventory Manager</option><option value="5">Warehouse Staff</option></select><span className="mt-1.5 block text-xs text-slate-500">Admin accounts cannot be created from this form.</span></label>
                        <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{mode === "create" ? "Temporary password" : "New password (optional)"} {mode === "create" && <span className="text-rose-500">*</span>}</span><input type="password" name="password" value={form.password} onChange={updateField} required={mode === "create"} minLength={6} autoComplete="new-password" placeholder={mode === "create" ? "At least 6 characters" : "Leave blank to keep current password"} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" /></label>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : <><Icon name="plus" size={17} />{mode === "create" ? "Create user" : "Save changes"}</>}</button></div>
                </form>
            </section>
        </div>
    );
}

function UserManagementContent() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [modal, setModal] = useState(null);

    const loadUsers = useCallback(async (refresh = false) => {
        if (refresh) setRefreshing(true); else setLoading(true);
        setPageError("");
        try {
            const response = await api.get("/user");
            if (!response.data?.success) throw new Error(response.data?.message || "Unable to fetch users.");
            const rows = Array.isArray(response.data?.data) ? response.data.data : [];
            setUsers(rows.filter((user) => [4, 5].includes(Number(user.roleId))));
        } catch (error) {
            console.error("Load users error:", error);
            setPageError(getErrorMessage(error, "Could not load users. Please try again."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return users.filter((user) => {
            const matchesRole = roleFilter === "all" || String(user.roleId) === roleFilter;
            const matchesQuery = !query || [user.name, user.email, String(user.id), ROLE_LABELS[user.roleId] || ""]
                .filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
            return matchesRole && matchesQuery;
        });
    }, [users, search, roleFilter]);

    const saveUser = async (payload) => {
        setSaving(true);
        setNotice("");
        try {
            if (modal.mode === "create") {
                const response = await api.post("/user", payload);
                if (!response.data?.success) throw new Error(response.data?.message || "Could not create user.");
                setNotice("User created successfully.");
            } else {
                const response = await api.put(`/user/${modal.user.id}`, payload);
                if (!response.data?.success) throw new Error(response.data?.message || "Could not update user.");
                setNotice("User details updated successfully.");
            }
            setModal(null);
            await loadUsers(true);
        } finally {
            setSaving(false);
        }
    };

    const removeUser = async (user) => {
        const confirmed = window.confirm(`Delete ${user.name}? This will soft-delete the user account.`);
        if (!confirmed) return;
        setNotice("");
        try {
            const response = await api.delete(`/user/${user.id}`);
            if (!response.data?.success) throw new Error(response.data?.message || "Could not delete user.");
            setNotice(`${user.name} was deleted successfully.`);
            await loadUsers(true);
        } catch (error) {
            setPageError(getErrorMessage(error, "Could not delete this user."));
        }
    };

    const inventoryManagers = users.filter((user) => Number(user.roleId) === 4).length;
    const warehouseStaff = users.filter((user) => Number(user.roleId) === 5).length;

    return (
        <main className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600"><span className="h-2 w-2 rounded-full bg-indigo-600" />StockPilot / Administration</div><h1 className="text-3xl font-bold tracking-tight text-slate-950">User Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create and manage inventory managers and warehouse staff accounts.</p></div>
                    <button type="button" onClick={() => setModal({ mode: "create", user: null })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"><Icon name="plus" size={18} />Create user</button>
                </div>

                {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><Icon name="close" size={17} /></button></div>}
                {pageError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><div className="flex gap-2"><Icon name="alert" size={18} className="mt-0.5 shrink-0" /><span>{pageError}</span></div><button type="button" onClick={() => setPageError("")} aria-label="Dismiss error"><Icon name="close" size={17} /></button></div>}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Managed users</span><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Icon name="users" /></span></div><div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : users.length}</div><p className="mt-1 text-xs text-slate-500">Inventory team accounts</p></div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Inventory managers</span><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><Icon name="shield" /></span></div><div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : inventoryManagers}</div><p className="mt-1 text-xs text-slate-500">Role ID 4</p></div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Warehouse staff</span><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><Icon name="user" /></span></div><div className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{loading ? "—" : warehouseStaff}</div><p className="mt-1 text-xs text-slate-500">Role ID 5</p></div>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Team members</h2><p className="mt-1 text-sm text-slate-500">Manage profile details and access roles.</p></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 sm:w-72"><Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or ID..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10" /></div><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filter by role" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"><option value="all">All roles</option><option value="4">Inventory Manager</option><option value="5">Warehouse Staff</option></select><button type="button" onClick={() => loadUsers(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"><Icon name="refresh" size={17} className={refreshing ? "animate-spin" : ""} />Refresh</button></div></div></div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-4 font-semibold">User</th><th className="px-6 py-4 font-semibold">Role</th><th className="px-6 py-4 font-semibold">User ID</th><th className="px-6 py-4 font-semibold">Created</th><th className="px-6 py-4 text-right font-semibold">Actions</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? <tr><td colSpan={5} className="px-6 py-16 text-center text-slate-500"><span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />Loading users...</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan={5} className="px-6 py-16 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="users" size={23} /></div><p className="font-semibold text-slate-800">{users.length === 0 ? "No team members yet" : "No users match your search"}</p><p className="mt-1 text-sm text-slate-500">{users.length === 0 ? "Create an account to start building your warehouse team." : "Try another name, email, ID or role filter."}</p>{users.length === 0 && <button type="button" onClick={() => setModal({ mode: "create", user: null })} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Icon name="plus" size={16} />Create first user</button>}</td></tr> : filteredUsers.map((user) => <tr key={user.id} className="transition hover:bg-slate-50/80"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700">{(user.name || "U").trim().charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{user.name}</p><p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500"><Icon name="mail" size={13} />{user.email}</p></div></div></td><td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${Number(user.roleId) === 4 ? "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{ROLE_LABELS[user.roleId] || ROLE_LABELS[Number(user.roleId)] || "Unknown role"}</span></td><td className="px-6 py-4 font-mono text-xs text-slate-500">USR-{String(user.id).padStart(4, "0")}</td><td className="px-6 py-4 text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal({ mode: "edit", user: { name: user.name || "", email: user.email || "", password: "", roleId: String(user.roleId), id: user.id } })} title="Edit user" aria-label={`Edit ${user.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Icon name="edit" size={17} /></button><button type="button" onClick={() => removeUser(user)} title="Delete user" aria-label={`Delete ${user.name}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><Icon name="trash" size={17} /></button></div></td></tr>)}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Showing <strong className="text-slate-700">{filteredUsers.length}</strong> of <strong className="text-slate-700">{users.length}</strong> team members</span><span className="inline-flex items-center gap-1.5"><Icon name="shield" size={14} />Admin access only</span></div>
                </section>
                <p className="text-xs leading-5 text-slate-400">Note: Deleting a user uses the backend's soft-delete behavior. Before deleting a user who is assigned to a warehouse, confirm how you want their warehouse assignments handled.</p>
            </div>
            {modal && <UserFormModal key={`${modal.mode}-${modal.user?.id || "new"}`} mode={modal.mode} initialData={modal.user || EMPTY_FORM} onClose={() => !saving && setModal(null)} onSave={saveUser} saving={saving} />}
        </main>
    );
}

export default function UsersPage() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <AdminLayout>
                <UserManagementContent />
            </AdminLayout>
        </AuthGuard>
    );
}
