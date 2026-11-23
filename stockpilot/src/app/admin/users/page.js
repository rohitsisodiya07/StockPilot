"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

const EMPTY_FORM = {
    name: "",
    email: "",
    password: "",
    roleId: "5",
};

const ROLE_LABELS = {
    4: "Inventory Manager",
    5: "Warehouse Staff",
};

function Icon({ name, size = 18, className = "" }) {
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
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="10" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        plus: <path d="M12 5v14M5 12h14" />,
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        edit: (
            <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </>
        ),
        trash: (
            <>
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
            </>
        ),
        close: <path d="m18 6-12 12M6 6l12 12" />,
        refresh: (
            <>
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" />
            </>
        ),
        mail: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="m9 12 2 2 4-4" />
            </>
        ),
        alert: (
            <>
                <path d="M12 9v4m0 4h.01" />
                <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </>
        ),
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
            </>
        ),
        check: <path d="M20 6 9 17l-5-5" />,
        building: (
            <>
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12h4" />
                <path d="M6 8h4" />
                <path d="M6 16h4" />
                <path d="M14 12h4" />
                <path d="M14 8h4" />
                <path d="M14 16h4" />
            </>
        ),
        send: (
            <>
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
            </>
        ),
        ban: (
            <>
                <circle cx="12" cy="12" r="10" />
                <path d="m4.9 4.9 14.2 14.2" />
            </>
        ),
        pause: (
            <>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
            </>
        ),
        play: <polygon points="5 3 19 12 5 21 5 3" />,
    };

    return <svg {...common}>{paths[name] || paths.users}</svg>;
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

/* ---------------- USER FORM MODAL ---------------- */

function UserFormModal({
    mode,
    initialData,
    warehouses = [],
    onClose,
    onSave,
    saving,
}) {
    const [form, setForm] = useState(initialData || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(initialData || EMPTY_FORM);
        setFormError("");
    }, [initialData]);

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setFormError("");

        const payload = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            roleId: Number(form.roleId),
        };

        if (form.warehouseId) {
            payload.warehouseId = Number(form.warehouseId);
        }

        if (!payload.name || payload.name.length < 2) {
            setFormError("Name must contain at least 2 characters.");
            return;
        }

        if (
            !payload.email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
        ) {
            setFormError("Please enter a valid email address.");
            return;
        }

        if (![4, 5].includes(payload.roleId)) {
            setFormError(
                "Select Inventory Manager or Warehouse Staff."
            );
            return;
        }

        if (mode === "create" && form.password.length < 6) {
            setFormError("Password must be at least 6 characters.");
            return;
        }

        if (form.password) {
            payload.password = form.password;
        }

        try {
            await onSave(payload);
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Could not save this user.")
            );
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) =>
                event.target === event.currentTarget &&
                !saving &&
                onClose()
            }
        >
            <section className="my-6 w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2.5 text-indigo-700 dark:text-indigo-300">
                            <Icon name="user" size={20} />
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                {mode === "create"
                                    ? "Create team member"
                                    : "Edit team member"}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {mode === "create"
                                    ? "Add an inventory manager or warehouse staff member."
                                    : "Update this user's profile and role."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-50"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5">
                    {formError && (
                        <div
                            role="alert"
                            className="flex gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-3 py-2.5 text-xs text-rose-700 dark:text-rose-300"
                        >
                            <Icon
                                name="alert"
                                size={16}
                                className="mt-0.5 shrink-0"
                            />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="grid gap-3">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Full name *
                            </span>

                            <input
                                name="name"
                                value={form.name}
                                onChange={updateField}
                                required
                                minLength={2}
                                maxLength={255}
                                autoFocus
                                placeholder="e.g. Rahul Sharma"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Email address *
                            </span>

                            <div className="relative">
                                <Icon
                                    name="mail"
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={updateField}
                                    required
                                    placeholder="name@company.com"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Role *
                            </span>

                            <select
                                name="roleId"
                                value={form.roleId}
                                onChange={updateField}
                                required
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            >
                                <option value="4">Inventory Manager</option>
                                <option value="5">Warehouse Staff</option>
                            </select>

                            <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                                Admin accounts cannot be created from this form.
                            </span>
                        </label>

                        {mode === "create" && (
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    Assign Warehouse (Optional)
                                </span>

                                <select
                                    name="warehouseId"
                                    value={form.warehouseId || ""}
                                    onChange={updateField}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                                >
                                    <option value="">-- Assign later or select warehouse --</option>
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name} ({wh.location || `WH-${wh.id}`})
                                        </option>
                                    ))}
                                </select>

                                <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                                    Account email & temporary password will be dispatched to the user automatically via Brevo.
                                </span>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {mode === "create"
                                    ? "Temporary password *"
                                    : "New password (optional)"}
                            </span>

                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={updateField}
                                required={mode === "create"}
                                minLength={6}
                                autoComplete="new-password"
                                placeholder={
                                    mode === "create"
                                        ? "At least 6 characters"
                                        : "Leave blank to keep current password"
                                }
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </label>
                    </div>

                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Icon name="plus" size={15} />
                                    {mode === "create"
                                        ? "Create user"
                                        : "Save changes"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

/* ---------------- APPROVE & ASSIGN MODAL ---------------- */

function ApproveModal({
    user,
    warehouses,
    onClose,
    onApprove,
    approving,
    selectedWarehouseId,
    setSelectedWarehouseId,
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
            onMouseDown={(e) => e.target === e.currentTarget && !approving && onClose()}
        >
            <div className="my-6 w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-emerald-700 dark:text-emerald-300">
                            <Icon name="check" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Approve & Assign Warehouse
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Activate account and dispatch email confirmation
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={approving}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* User Info Box */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Applicant:</span>
                            <strong className="text-slate-900 dark:text-white font-bold">{user?.name}</strong>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Email:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Role:</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {ROLE_LABELS[user?.roleId] || "Warehouse Staff"}
                            </span>
                        </div>
                    </div>

                    {/* Warehouse Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Assign Target Warehouse *
                        </label>
                        <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                        >
                            <option value="">-- Choose a warehouse --</option>
                            {warehouses.map((wh) => (
                                <option key={wh.id} value={wh.id}>
                                    {wh.name} ({wh.location || `WH-${wh.id}`})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            The user will be authorized to access operations strictly in this warehouse.
                        </p>
                    </div>

                    {/* Automated Email Notice */}
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 flex gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                        <Icon name="mail" size={16} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div>
                            <strong className="block font-semibold">Automated Email Dispatch</strong>
                            An approval email will be automatically sent to <strong>{user?.email}</strong> with their assigned warehouse name and login link.
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={approving}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onApprove}
                            disabled={approving || !selectedWarehouseId}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {approving ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Approving & Sending Email...
                                </>
                            ) : (
                                <>
                                    <Icon name="send" size={14} />
                                    Approve & Send Confirmation Email
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------------- USER MANAGEMENT ---------------- */

function UserManagementContent() {
    const [users, setUsers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modal, setModal] = useState(null);
    const [approveModal, setApproveModal] = useState(null);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

    const loadData = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            const [userRes, whRes] = await Promise.all([
                api.get("/user"),
                api.get("/warehouse").catch(() => ({ data: { data: [] } })),
            ]);

            if (!userRes.data?.success) {
                throw new Error(
                    userRes.data?.message || "Unable to fetch users."
                );
            }

            const rows = Array.isArray(userRes.data?.data)
                ? userRes.data.data
                : [];

            setUsers(
                rows.filter((user) =>
                    [4, 5].includes(Number(user.roleId))
                )
            );

            const whList = Array.isArray(whRes.data?.data)
                ? whRes.data.data
                : [];
            setWarehouses(whList);
        } catch (error) {
            console.error("Load users error:", error);

            setPageError(
                getErrorMessage(
                    error,
                    "Could not load users. Please try again."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-dismiss success notification after 4 seconds
    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => {
            setNotice("");
        }, 4000);
        return () => clearTimeout(timer);
    }, [notice]);

    const pendingUsers = useMemo(() => {
        return users.filter((u) => u.status === "PENDING");
    }, [users]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => {
            const matchesRole =
                roleFilter === "all" ||
                String(user.roleId) === roleFilter;

            const matchesStatus =
                statusFilter === "all" ||
                user.status === statusFilter;

            const assignedWarehouseName =
                user.warehouseAssignments?.[0]?.warehouse?.name || "";

            const matchesQuery =
                !query ||
                [
                    user.name,
                    user.email,
                    String(user.id),
                    ROLE_LABELS[user.roleId] || "",
                    assignedWarehouseName,
                    user.status,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(query)
                    );

            return matchesRole && matchesStatus && matchesQuery;
        });
    }, [users, search, roleFilter, statusFilter]);

    const saveUser = async (payload) => {
        setSaving(true);
        setNotice("");

        try {
            if (modal.mode === "create") {
                const response = await api.post("/user", payload);

                if (!response.data?.success) {
                    throw new Error(
                        response.data?.message || "Could not create user."
                    );
                }

                setNotice("User created successfully.");
            } else {
                const response = await api.put(
                    `/user/${modal.user.id}`,
                    payload
                );

                if (!response.data?.success) {
                    throw new Error(
                        response.data?.message || "Could not update user."
                    );
                }

                setNotice("User details updated successfully.");
            }

            setModal(null);
            await loadData(true);
        } finally {
            setSaving(false);
        }
    };

    const handleApprove = async () => {
        if (!approveModal?.user || !selectedWarehouseId) return;

        setApproving(true);
        setNotice("");
        setPageError("");

        try {
            const response = await api.post(`/user/${approveModal.user.id}/approve`, {
                warehouseId: Number(selectedWarehouseId),
            });

            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to approve user.");
            }

            setNotice(response.data?.message || `User ${approveModal.user.name} approved successfully! Confirmation email sent.`);
            setApproveModal(null);
            setSelectedWarehouseId("");
            await loadData(true);
        } catch (error) {
            setPageError(getErrorMessage(error, "Could not approve user."));
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async (user) => {
        const confirmed = window.confirm(
            `Reject registration request for ${user.name}? This user will not be able to log in.`
        );

        if (!confirmed) return;

        setNotice("");
        setPageError("");

        try {
            const response = await api.post(`/user/${user.id}/reject`);

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Could not reject user."
                );
            }

            setNotice(`User registration for ${user.name} was rejected.`);
            await loadData(true);
        } catch (error) {
            setPageError(
                getErrorMessage(error, "Could not reject this user.")
            );
        }
    };

    const toggleStatus = async (user) => {
        const isCurrentlyActive = user.status === "ACTIVE";
        const nextStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";
        const confirmMsg = isCurrentlyActive
            ? `Deactivate ${user.name}? This user will not be able to log in.`
            : `Activate ${user.name}? This will restore their login access.`;

        if (!window.confirm(confirmMsg)) return;

        // Optimistic UI update: instantly update status without waiting for network
        const previousUsers = [...users];
        setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
        );
        setNotice(`User ${user.name} is now ${nextStatus.toLowerCase()}.`);
        setPageError("");

        try {
            const response = await api.put(`/user/${user.id}`, { status: nextStatus });

            if (!response.data?.success) {
                throw new Error(response.data?.message || "Failed to update user status.");
            }
        } catch (error) {
            // Revert state if backend request fails
            setUsers(previousUsers);
            setNotice("");
            setPageError(getErrorMessage(error, "Could not update user status."));
        }
    };

    const removeUser = async (user) => {
        const confirmed = window.confirm(
            `Permanently delete ${user.name}? This will remove the account completely.`
        );

        if (!confirmed) return;

        // Instant Optimistic Update: Immediately remove user from view (0ms UI lag)
        const previousUsers = [...users];
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setNotice(`User "${user.name}" deleted successfully.`);
        setPageError("");

        try {
            const response = await api.delete(`/user/${user.id}`);

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Could not delete user."
                );
            }

            setNotice(response.data?.message || `User "${user.name}" deleted successfully.`);
        } catch (error) {
            // Revert user back into list if server returns an error
            setUsers(previousUsers);
            setNotice("");
            setPageError(
                getErrorMessage(error, "Could not delete this user.")
            );
        }
    };

    const inventoryManagers = users.filter(
        (user) => Number(user.roleId) === 4
    ).length;

    const warehouseStaff = users.filter(
        (user) => Number(user.roleId) === 5
    ).length;

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        StockPilot / Administration
                    </div>

                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                        User Management & Approvals
                    </h1>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Approve self-registered staff, assign warehouse privileges, and manage operational teams.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        setModal({ mode: "create", user: null })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
                >
                    <Icon name="plus" size={16} />
                    Create user
                </button>
            </div>

            {/* Notifications */}
            {notice && (
                <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <Icon name="check" size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span>{notice}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setNotice("")}
                        aria-label="Dismiss notification"
                    >
                        <Icon name="close" size={15} />
                    </button>
                </div>
            )}

            {pageError && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-3 text-xs text-rose-700 dark:text-rose-300 shadow-sm"
                >
                    <div className="flex gap-2">
                        <Icon
                            name="alert"
                            size={16}
                            className="mt-0.5 shrink-0"
                        />
                        <span>{pageError}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setPageError("")}
                        aria-label="Dismiss error"
                    >
                        <Icon name="close" size={15} />
                    </button>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Users */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Managed users
                        </span>

                        <span className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-700 dark:text-indigo-400">
                            <Icon name="users" size={18} />
                        </span>
                    </div>

                    <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {loading ? "—" : users.length}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Total team accounts
                    </p>
                </div>

                {/* Pending Approvals Card */}
                <div
                    onClick={() => setStatusFilter(statusFilter === "PENDING" ? "all" : "PENDING")}
                    className={`rounded-2xl border p-4 shadow-xs cursor-pointer transition ${
                        pendingUsers.length > 0
                            ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 hover:border-amber-400"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${pendingUsers.length > 0 ? "text-amber-800 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                            Pending Approvals
                        </span>

                        <span className={`rounded-xl p-2 ${pendingUsers.length > 0 ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                            <Icon name="alert" size={18} />
                        </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                        <span className={`text-2xl font-black tracking-tight ${pendingUsers.length > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-white"}`}>
                            {loading ? "—" : pendingUsers.length}
                        </span>
                        {pendingUsers.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                Action Required
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {pendingUsers.length > 0 ? "Click to view requests awaiting warehouse" : "No pending signups"}
                    </p>
                </div>

                {/* Managers */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Inventory managers
                        </span>

                        <span className="rounded-xl bg-violet-50 dark:bg-violet-950/60 p-2 text-violet-700 dark:text-violet-400">
                            <Icon name="shield" size={18} />
                        </span>
                    </div>

                    <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {loading ? "—" : inventoryManagers}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Role ID 4
                    </p>
                </div>

                {/* Staff */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Warehouse staff
                        </span>

                        <span className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-700 dark:text-emerald-400">
                            <Icon name="user" size={18} />
                        </span>
                    </div>

                    <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {loading ? "—" : warehouseStaff}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Role ID 5
                    </p>
                </div>
            </div>

            {/* Team Members Section */}
            <section className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="border-b border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setStatusFilter("all")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === "all"
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                            >
                                All Users ({users.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter("PENDING")}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                    statusFilter === "PENDING"
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                                }`}
                            >
                                {pendingUsers.length > 0 && (
                                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                )}
                                Pending Approval ({pendingUsers.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter("ACTIVE")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === "ACTIVE"
                                        ? "bg-emerald-700 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                            >
                                Active ({users.filter((u) => u.status === "ACTIVE").length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter("INACTIVE")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === "INACTIVE"
                                        ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                            >
                                Inactive ({users.filter((u) => u.status === "INACTIVE").length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatusFilter("REJECTED")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    statusFilter === "REJECTED"
                                        ? "bg-rose-700 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                            >
                                Rejected ({users.filter((u) => u.status === "REJECTED").length})
                            </button>
                        </div>

                        {/* Search & Actions */}
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative min-w-0 sm:w-64">
                                <Icon
                                    name="search"
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search name, email, warehouse..."
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white outline-none transition focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/10"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={(event) =>
                                    setRoleFilter(event.target.value)
                                }
                                aria-label="Filter by role"
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            >
                                <option value="all">All roles</option>
                                <option value="4">Inventory Manager</option>
                                <option value="5">Warehouse Staff</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                            >
                                <Icon
                                    name="refresh"
                                    size={15}
                                    className={
                                        refreshing ? "animate-spin" : ""
                                    }
                                />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3 font-semibold">User</th>
                                <th className="px-4 py-3 font-semibold">Role</th>
                                <th className="px-4 py-3 font-semibold">Account Status</th>
                                <th className="px-4 py-3 font-semibold">Assigned Warehouse</th>
                                <th className="px-4 py-3 font-semibold">Created</th>
                                <th className="px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center text-xs text-slate-500 dark:text-slate-400"
                                    >
                                        <span className="mx-auto mb-2 block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-12 text-center"
                                    >
                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            <Icon name="users" size={20} />
                                        </div>

                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            {statusFilter === "PENDING"
                                                ? "No pending approvals"
                                                : users.length === 0
                                                ? "No team members yet"
                                                : "No users match your search"}
                                        </p>

                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            {statusFilter === "PENDING"
                                                ? "All self-registered users have been reviewed and assigned."
                                                : users.length === 0
                                                ? "Create an account to start building your warehouse team."
                                                : "Try adjusting your search or filters."}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const assignment = user.warehouseAssignments?.[0];
                                    const warehouseName = assignment?.warehouse?.name;
                                    const isPending = user.status === "PENDING";
                                    const isRejected = user.status === "REJECTED";

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`transition ${
                                                isPending
                                                    ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            {/* User Details */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                                        isPending
                                                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                                            : "bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 text-indigo-700 dark:text-indigo-300"
                                                    }`}>
                                                        {(user.name || "U")
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                                            {user.name}
                                                        </p>

                                                        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                            <Icon
                                                                name="mail"
                                                                size={11}
                                                            />
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                                        Number(user.roleId) === 4
                                                            ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-200 dark:ring-violet-800"
                                                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800"
                                                    }`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {ROLE_LABELS[user.roleId] || "Staff"}
                                                </span>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-3">
                                                {isPending ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-300 dark:ring-amber-800">
                                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                                        Pending Approval
                                                    </span>
                                                ) : user.status === "INACTIVE" ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                        Inactive
                                                    </span>
                                                ) : isRejected ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-800">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-800">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        Active
                                                    </span>
                                                )}
                                            </td>

                                            {/* Assigned Warehouse */}
                                            <td className="px-4 py-3">
                                                {warehouseName ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                                                        <Icon name="building" size={13} className="text-slate-400" />
                                                        <span>{warehouseName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                                        <Icon name="alert" size={12} />
                                                        Not assigned
                                                    </span>
                                                )}
                                            </td>

                                            {/* Created */}
                                            <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400">
                                                {user.createdAt
                                                    ? new Date(
                                                          user.createdAt
                                                      ).toLocaleDateString()
                                                    : "—"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                {isPending ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setApproveModal({ user });
                                                                setSelectedWarehouseId(
                                                                    warehouses[0]?.id
                                                                        ? String(warehouses[0].id)
                                                                        : ""
                                                                );
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                                                            title="Approve registration and assign warehouse"
                                                        >
                                                            <Icon name="check" size={13} />
                                                            Approve & Assign
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(user)}
                                                            className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-1.5 text-rose-700 dark:text-rose-300 transition hover:bg-rose-100"
                                                            title="Reject request"
                                                        >
                                                            <Icon name="ban" size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user)}
                                                            title="Delete request"
                                                            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                                                        >
                                                            <Icon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-1.5">
                                                        {/* 1-Click Inactive / Active Toggle */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleStatus(user)}
                                                            title={user.status === "ACTIVE" ? "Deactivate user" : "Activate user"}
                                                            className={`rounded-lg border p-1.5 transition ${
                                                                user.status === "ACTIVE"
                                                                    ? "border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                                    : "border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                            }`}
                                                        >
                                                            <Icon name={user.status === "ACTIVE" ? "pause" : "play"} size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setApproveModal({ user });
                                                                const currentWhId =
                                                                    user.warehouseAssignments?.[0]?.warehouseId;
                                                                setSelectedWarehouseId(
                                                                    currentWhId
                                                                        ? String(currentWhId)
                                                                        : warehouses[0]?.id
                                                                        ? String(warehouses[0].id)
                                                                        : ""
                                                                );
                                                            }}
                                                            title="Assign or reassign warehouse"
                                                            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 transition hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300"
                                                        >
                                                            <Icon name="building" size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setModal({
                                                                    mode: "edit",
                                                                    user: {
                                                                        name: user.name || "",
                                                                        email: user.email || "",
                                                                        password: "",
                                                                        roleId: String(user.roleId),
                                                                        id: user.id,
                                                                    },
                                                                })
                                                            }
                                                            title="Edit user"
                                                            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 transition hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300"
                                                        >
                                                            <Icon name="edit" size={14} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeUser(user)}
                                                            title="Permanently delete user"
                                                            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 transition hover:border-rose-200 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300"
                                                        >
                                                            <Icon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Showing{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                            {filteredUsers.length}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-slate-700 dark:text-slate-200">
                            {users.length}
                        </strong>{" "}
                        team members
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                        <Icon name="shield" size={13} />
                        Admin approval & warehouse binding required for login
                    </span>
                </div>
            </section>

            {/* User Form Modal */}
            {modal && (
                <UserFormModal
                    key={`${modal.mode}-${modal.user?.id || "new"}`}
                    mode={modal.mode}
                    initialData={modal.user || EMPTY_FORM}
                    warehouses={warehouses}
                    onClose={() => !saving && setModal(null)}
                    onSave={saveUser}
                    saving={saving}
                />
            )}

            {/* Approve Modal */}
            {approveModal && (
                <ApproveModal
                    user={approveModal.user}
                    warehouses={warehouses}
                    onClose={() => !approving && setApproveModal(null)}
                    onApprove={handleApprove}
                    approving={approving}
                    selectedWarehouseId={selectedWarehouseId}
                    setSelectedWarehouseId={setSelectedWarehouseId}
                />
            )}

            {/* Floating Toast Notification */}
            {notice && (
                <div
                    role="status"
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-white border border-emerald-500/40 px-5 py-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-200"
                >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Icon name="check" size={16} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Success</p>
                        <p className="text-xs text-slate-100 font-medium">{notice}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotice("")}
                        className="ml-3 text-slate-400 hover:text-white transition"
                    >
                        <Icon name="close" size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}

/* ---------------- PAGE EXPORT ---------------- */

export default function UsersPage() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <UserManagementContent />
        </AuthGuard>
    );
}
