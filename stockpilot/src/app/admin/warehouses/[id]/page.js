"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";

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
        back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
        boxes: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M4 7.5V16l8 5 8-5V7.5M12 12v9" /></>,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
        pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
        map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
        mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
        check: <path d="m5 12 4 4L19 6" />,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M19 8v6M16 11h6" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
    };

    return <svg {...common}>{paths[name] || paths.warehouse}</svg>;
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function SummaryCard({ title, value, note, icon, tone = "blue" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700 ring-blue-100",
        violet: "bg-violet-50 text-violet-700 ring-violet-100",
        amber: "bg-amber-50 text-amber-700 ring-amber-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-500 sm:text-base">{title}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{value}</p>
                    <p className="mt-2 text-sm text-slate-500">{note}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>
                    <Icon name={icon} size={23} />
                </div>
            </div>
        </div>
    );
}

function WarehouseDetailsContent() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [teamAssignments, setTeamAssignments] = useState([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [assignMode, setAssignMode] = useState("existing");
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [userForm, setUserForm] = useState({ name: "", email: "", password: "", roleId: "5" });
    const [assignmentBusy, setAssignmentBusy] = useState(false);
    const [assignmentMessage, setAssignmentMessage] = useState("");
    const [assignmentError, setAssignmentError] = useState("");
    const [removingAssignmentId, setRemovingAssignmentId] = useState(null);

    const loadDetails = useCallback(async (showRefresh = false) => {
        if (!id) return;
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setError("");

        try {
            const response = await api.get(`/warehouse/${id}/details`);
            if (!response.data?.success) {
                throw new Error(response.data?.message || "Unable to load warehouse details.");
            }
            setWarehouse(response.data?.data || null);
        } catch (requestError) {
            console.error("Load warehouse details error:", requestError);
            setError(getErrorMessage(requestError, "Could not load warehouse details. Please try again."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    const loadTeamAssignments = useCallback(async () => {
        if (!id) return;
        setTeamLoading(true);
        try {
            const response = await api.get(`/userWarehouse/warehouse/${id}`);
            const assignments = response.data?.data;
            setTeamAssignments(Array.isArray(assignments) ? assignments : []);
        } catch (requestError) {
            console.error("Load warehouse assignments error:", requestError);
            // Keep the details endpoint's assigned users as a fallback.
            setTeamAssignments([]);
        } finally {
            setTeamLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadTeamAssignments();
    }, [loadTeamAssignments]);

    const openUserModal = async (mode = "existing") => {
        setAssignMode(mode);
        setShowUserModal(true);
        setAssignmentMessage("");
        setAssignmentError("");
        setSelectedUserId("");
        try {
            const response = await api.get("/user");
            const users = Array.isArray(response.data?.data) ? response.data.data : [];
            const currentAssignedIds = new Set(
                [...teamAssignments].map((assignment) => Number(assignment.userId ?? assignment.user?.id))
            );
            setAvailableUsers(users.filter((user) =>
                [4, 5].includes(Number(user.roleId)) && !currentAssignedIds.has(Number(user.id))
            ));
        } catch (requestError) {
            console.error("Load available users error:", requestError);
            setAssignmentError(getErrorMessage(requestError, "Could not load users. Admin access may be required."));
        }
    };

    const handleAssignExisting = async (event) => {
        event.preventDefault();
        if (!selectedUserId) {
            setAssignmentError("Please select a user.");
            return;
        }
        setAssignmentBusy(true);
        setAssignmentError("");
        setAssignmentMessage("");
        try {
            const response = await api.post("/userWarehouse", {
                userId: Number(selectedUserId),
                warehouseId: Number(id),
            });
            if (response.data?.success === false) throw new Error(response.data?.message || "Assignment failed.");
            setAssignmentMessage("User assigned successfully.");
            await Promise.all([loadTeamAssignments(), loadDetails(true)]);
            setShowUserModal(false);
        } catch (requestError) {
            setAssignmentError(getErrorMessage(requestError, "Could not assign user."));
        } finally {
            setAssignmentBusy(false);
        }
    };

    const handleCreateAndAssign = async (event) => {
        event.preventDefault();
        setAssignmentBusy(true);
        setAssignmentError("");
        setAssignmentMessage("");
        let createdUserId = null;
        try {
            const createResponse = await api.post("/user", {
                name: userForm.name.trim(),
                email: userForm.email.trim().toLowerCase(),
                password: userForm.password,
                roleId: Number(userForm.roleId),
            });
            const createdUser = createResponse.data?.data;
            createdUserId = createdUser?.id;
            if (!createdUserId) throw new Error(createResponse.data?.message || "User was created but no user ID was returned.");

            try {
                await api.post("/userwarehouse", {
                    userId: Number(createdUserId),
                    warehouseId: Number(id),
                });
            } catch (assignmentRequestError) {
                throw new Error(`User created, but warehouse assignment failed: ${getErrorMessage(assignmentRequestError, "Please assign the user manually.")}`);
            }

            setAssignmentMessage("User created and assigned to this warehouse successfully.");
            setUserForm({ name: "", email: "", password: "", roleId: "5" });
            await Promise.all([loadTeamAssignments(), loadDetails(true)]);
            setShowUserModal(false);
        } catch (requestError) {
            setAssignmentError(getErrorMessage(requestError, "Could not create and assign user."));
        } finally {
            setAssignmentBusy(false);
        }
    };

    const handleRemoveAssignment = async (userId) => {
        if (!window.confirm("Remove this user from the warehouse? The user account will not be deleted.")) return;
        setRemovingAssignmentId(userId);
        setAssignmentError("");
        setAssignmentMessage("");
        try {
            const response = await api.delete(`/userWarehouse/user/${userId}/warehouse/${id}`);
            if (response.data?.success === false) throw new Error(response.data?.message || "Could not remove assignment.");
            setAssignmentMessage("User unassigned from this warehouse.");
            await Promise.all([loadTeamAssignments(), loadDetails(true)]);
        } catch (requestError) {
            setAssignmentError(getErrorMessage(requestError, "Could not remove assignment. Admin access may be required."));
        } finally {
            setRemovingAssignmentId(null);
        }
    };

    const inventory = Array.isArray(warehouse?.inventory) ? warehouse.inventory : [];
    const lowStockItems = Array.isArray(warehouse?.lowStockItems) ? warehouse.lowStockItems : [];
    const assignedUsers = teamAssignments.length
        ? teamAssignments.map((assignment) => ({
            ...assignment.user,
            id: assignment.user?.id ?? assignment.userId,
            role: assignment.user?.role?.name ?? assignment.user?.role ?? (Number(assignment.user?.roleId) === 4 ? "INVENTORY_MANAGER" : Number(assignment.user?.roleId) === 5 ? "WAREHOUSE_STAFF" : "USER"),
            assignmentUserId: assignment.userId,
        }))
        : (Array.isArray(warehouse?.assignedUsers) ? warehouse.assignedUsers : []);
    const summary = warehouse?.inventorySummary || {
        totalProducts: inventory.length,
        totalInventoryUnits: inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        lowStockCount: lowStockItems.length,
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
    };

    const roleLabel = (role) => {
        if (role === "INVENTORY_MANAGER") return "Inventory Manager";
        if (role === "WAREHOUSE_STAFF") return "Warehouse Staff";
        return String(role || "User").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const roleTone = (role) => role === "INVENTORY_MANAGER"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

    return (
        <div className="mx-auto max-w-[1680px] space-y-6 text-[15px] sm:space-y-8">
            <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 px-5 py-6 shadow-sm sm:px-8 sm:py-8">
                <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <button onClick={() => router.push("/admin/warehouses")} className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                            <Icon name="back" size={17} /> Back to warehouses
                        </button>
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 sm:h-16 sm:w-16">
                                <Icon name="warehouse" size={29} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Warehouse profile · #{id}</p>
                                <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                    {loading ? "Loading warehouse..." : warehouse?.name || "Warehouse details"}
                                </h1>
                                {warehouse && (
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 sm:text-base">
                                        <span className="inline-flex items-center gap-2"><Icon name="pin" size={17} className="text-blue-600" />{warehouse.location || "Location unavailable"}</span>
                                        <span className="inline-flex items-center gap-2"><Icon name="calendar" size={17} className="text-blue-600" />Created {formatDate(warehouse.createdAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => loadDetails(true)} disabled={loading || refreshing} className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-60">
                        <Icon name="refresh" size={18} className={refreshing ? "animate-spin" : ""} /> Refresh data
                    </button>
                </div>
            </section>

            {error && (
                <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-bold text-rose-900">Unable to load warehouse details</p>
                        <p className="mt-1 text-sm text-rose-800">{error}</p>
                    </div>
                    <button onClick={() => loadDetails()} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">Try again</button>
                </div>
            )}

            {loading ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white p-6"><div className="h-4 w-1/2 rounded bg-slate-100" /><div className="mt-5 h-9 w-1/3 rounded bg-slate-100" /><div className="mt-3 h-3 w-2/3 rounded bg-slate-100" /></div>)}
                </div>
            ) : warehouse && !error ? (
                <>
                    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        <SummaryCard title="Unique products" value={summary.totalProducts ?? 0} note="Products stocked at this location" icon="package" tone="blue" />
                        <SummaryCard title="Total stock units" value={Number(summary.totalInventoryUnits ?? 0).toLocaleString()} note="Combined quantity across inventory" icon="boxes" tone="violet" />
                        <SummaryCard title="Low-stock products" value={summary.lowStockCount ?? lowStockItems.length} note="At or below reorder level" icon="alert" tone="amber" />
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Inventory overview</h2>
                                <p className="mt-1 text-sm text-slate-500 sm:text-base">Product quantities and reorder thresholds for this warehouse.</p>
                            </div>
                            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"><Icon name="package" size={17} /> {inventory.length} records</span>
                        </div>
                        {inventory.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Icon name="package" size={26} /></div>
                                <h3 className="mt-4 text-lg font-bold text-slate-900">No inventory recorded</h3>
                                <p className="mt-1 text-sm text-slate-500">This warehouse does not have any inventory records yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] border-collapse text-left">
                                    <thead><tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><th className="px-5 py-4 font-bold sm:px-6">Product</th><th className="px-5 py-4 font-bold">SKU</th><th className="px-5 py-4 text-right font-bold">Available units</th><th className="px-5 py-4 text-right font-bold">Reorder level</th><th className="px-5 py-4 font-bold">Stock status</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inventory.map((item) => {
                                            const isLow = Number(item.quantity) <= Number(item.reorderLevel);
                                            return (
                                                <tr key={item.id} className="transition hover:bg-slate-50/80">
                                                    <td className="px-5 py-4 sm:px-6"><div className="font-semibold text-slate-900">{item.product?.name || `Product #${item.productId}`}</div><div className="mt-1 text-xs text-slate-400">Product ID #{item.productId}</div></td>
                                                    <td className="px-5 py-4 text-sm font-medium text-slate-600">{item.product?.sku || "—"}</td>
                                                    <td className="px-5 py-4 text-right text-base font-bold tabular-nums text-slate-900">{Number(item.quantity || 0).toLocaleString()}</td>
                                                    <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-600">{Number(item.reorderLevel || 0).toLocaleString()}</td>
                                                    <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isLow ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><span className={`h-1.5 w-1.5 rounded-full ${isLow ? "bg-amber-500" : "bg-emerald-500"}`} />{isLow ? "Low stock" : "In stock"}</span></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon name="alert" size={22} /></div>
                                    <div><h2 className="text-xl font-bold text-slate-950">Low-stock alerts</h2><p className="mt-1 text-sm text-slate-500">Items at or below their reorder level.</p></div>
                                </div>
                            </div>
                            {lowStockItems.length === 0 ? (
                                <div className="px-5 py-10 text-center sm:px-6">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" size={24} /></div>
                                    <p className="mt-3 font-semibold text-slate-900">All stocked products are above reorder level</p>
                                    <p className="mt-1 text-sm text-slate-500">No low-stock products were returned by the API.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {lowStockItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{item.product?.name || `Product #${item.productId}`}</p><p className="mt-1 text-xs text-slate-500">{item.product?.sku || "SKU unavailable"}</p></div><div className="shrink-0 text-right"><p className="font-bold text-amber-700">{item.quantity} left</p><p className="text-xs text-slate-500">Reorder at {item.reorderLevel}</p></div></div>)}
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon name="users" size={22} /></div>
                                        <div><h2 className="text-xl font-bold text-slate-950">Assigned team</h2><p className="mt-1 text-sm text-slate-500">{assignedUsers.length} assigned {assignedUsers.length === 1 ? "user" : "users"}</p></div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => openUserModal("existing")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"><Icon name="users" size={16} /> Assign existing</button>
                                        <button onClick={() => openUserModal("create")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Icon name="userPlus" size={16} /> Create & assign</button>
                                    </div>
                                </div>
                            </div>
                            {(assignmentMessage || assignmentError) && !showUserModal && <div className={`mx-5 mt-4 rounded-xl border px-4 py-3 text-sm sm:mx-6 ${assignmentError ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{assignmentError || assignmentMessage}</div>}
                            {teamLoading ? (
                                <div className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">Loading assigned users…</div>
                            ) : assignedUsers.length === 0 ? (
                                <div className="px-5 py-10 text-center sm:px-6">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Icon name="users" size={23} /></div>
                                    <p className="mt-3 font-semibold text-slate-900">No users assigned</p>
                                    <p className="mt-1 text-sm text-slate-500">No team members are assigned to this warehouse yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {assignedUsers.map((user) => (
                                        <div key={user.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-800">{(user.name || "U").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words font-semibold text-slate-900">{user.name}</p>
                                                <p className="mt-1 flex items-center gap-1.5 break-all text-sm text-slate-500"><Icon name="mail" size={14} className="shrink-0" />{user.email}</p>
                                                <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${roleTone(user.role)}`}>{roleLabel(user.role)}</span>
                                            </div>
                                            <button onClick={() => handleRemoveAssignment(user.assignmentUserId ?? user.id)} disabled={removingAssignmentId === (user.assignmentUserId ?? user.id)} title="Unassign user" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"><Icon name="trash" size={15} />{removingAssignmentId === (user.assignmentUserId ?? user.id) ? "Removing…" : "Unassign"}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {showUserModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
                            <div className="my-auto w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{warehouse.name}</p>
                                        <h2 id="assignment-modal-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{assignMode === "create" ? "Create & assign user" : "Assign existing user"}</h2>
                                        <p className="mt-2 text-sm text-slate-500">Inventory Manager: maximum one per warehouse. Multiple Warehouse Staff are allowed.</p>
                                    </div>
                                    <button onClick={() => setShowUserModal(false)} aria-label="Close modal" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Icon name="close" size={20} /></button>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                    <button onClick={() => { setAssignMode("existing"); setAssignmentError(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${assignMode === "existing" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Existing user</button>
                                    <button onClick={() => { setAssignMode("create"); setAssignmentError(""); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${assignMode === "create" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Create new user</button>
                                </div>
                                {assignmentError && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{assignmentError}</div>}
                                {assignMode === "existing" ? (
                                    <form onSubmit={handleAssignExisting} className="mt-5 space-y-4">
                                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Select user</span><select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="">Choose Inventory Manager or Warehouse Staff</option>{availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email} · {Number(user.roleId) === 4 ? "Inventory Manager" : "Warehouse Staff"}</option>)}</select><span className="mt-1.5 block text-xs text-slate-500">Users already assigned to this warehouse are hidden.</span></label>
                                        {availableUsers.length === 0 && <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800">No available users found. You can create a new user instead.</p>}
                                        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowUserModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={assignmentBusy || !selectedUserId} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{assignmentBusy ? "Assigning…" : "Assign user"}</button></div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleCreateAndAssign} className="mt-5 space-y-4">
                                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</span><input required minLength={2} maxLength={255} value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} placeholder="Enter full name" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
                                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Email address</span><input required type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} placeholder="name@company.com" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
                                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Temporary password</span><input required minLength={6} type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 6 characters" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
                                        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Role</span><select value={userForm.roleId} onChange={(event) => setUserForm((current) => ({ ...current, roleId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="4">Inventory Manager</option><option value="5">Warehouse Staff</option></select></label>
                                        {Number(userForm.roleId) === 4 && assignedUsers.some((user) => Number(user.roleId) === 4 || user.role === "INVENTORY_MANAGER") && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">This warehouse already has an Inventory Manager. Unassign the current manager before creating another one.</p>}
                                        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowUserModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={assignmentBusy} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{assignmentBusy ? "Creating & assigning…" : "Create & assign"}</button></div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-bold text-slate-950">Warehouse information</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon name="map" size={15} /> Full address</p><p className="mt-2 whitespace-pre-wrap font-medium leading-6 text-slate-800">{warehouse.address || "Address unavailable"}</p></div>
                            <div className="rounded-xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon name="calendar" size={15} /> Record dates</p><p className="mt-2 text-sm text-slate-700">Created: <span className="font-semibold">{formatDate(warehouse.createdAt)}</span></p><p className="mt-1 text-sm text-slate-700">Last updated: <span className="font-semibold">{formatDate(warehouse.updatedAt)}</span></p></div>
                        </div>
                    </section>
                </>
            ) : null}
        </div>
    );
}

export default function WarehouseDetailsPage() {
    return (
        <AuthGuard allowedRoles={[1, 4, 5]}>
            <AdminLayout>
                <WarehouseDetailsContent />
            </AdminLayout>
        </AuthGuard>
    );
}
