
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

function Icon({ name, size = 20 }) {
    const icons = {
        back: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
        warehouse: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path d="M9 21v-7h6v7" /></>,
        refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" /></>,
        package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></>,
        boxes: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M4 7.5V16l8 5 8-5V7.5M12 12v9" /></>,
        alert: <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>,
        users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /></>,
        pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
        mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        edit: <><path d="m16 4 4 4L8 20H4v-4L16 4Z" /><path d="m14 6 4 4" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></>,
        check: <path d="m5 12 4 4L19 6" />,
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
            aria-hidden="true"
        >
            {icons[name] || icons.warehouse}
        </svg>
    );
}

function getErrorMessage(error, fallback) {
    return error?.response?.data?.message || error?.message || fallback;
}

function SummaryCard({ title, value, note, icon, tone = "blue" }) {
    const tones = {
        blue: "bg-blue-50 text-blue-700",
        violet: "bg-violet-50 text-violet-700",
        amber: "bg-amber-50 text-amber-700",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">{note}</p>
                </div>
                <div className={`rounded-xl p-3 ${tones[tone]}`}>
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
    const [teamAssignments, setTeamAssignments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [teamLoading, setTeamLoading] = useState(false);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [showStaffModal, setShowStaffModal] = useState(false);
    const [modalMode, setModalMode] = useState("create");

    const [availableStaff, setAvailableStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState("");

    const [staffForm, setStaffForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [editingStaff, setEditingStaff] = useState(null);
    const [busy, setBusy] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    // Fetch warehouse details
    const loadDetails = useCallback(async (isRefresh = false) => {
        if (!id) return;

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError("");

        try {
            const response = await api.get(`/warehouse/${id}/details`);

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Unable to load warehouse details."
                );
            }

            setWarehouse(response.data.data || null);
        } catch (err) {
            console.error("Warehouse details error:", err);
            setError(
                getErrorMessage(err, "Could not load warehouse details.")
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    // Fetch team assignments
    const loadTeamAssignments = useCallback(async () => {
        if (!id) return;

        setTeamLoading(true);

        try {
            const response = await api.get(
                `/userWarehouse/warehouse/${id}`
            );

            const assignments = response.data?.data;

            setTeamAssignments(
                Array.isArray(assignments) ? assignments : []
            );
        } catch (err) {
            console.error("Team assignments error:", err);
            setTeamAssignments([]);
        } finally {
            setTeamLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDetails();
        loadTeamAssignments();
    }, [loadDetails, loadTeamAssignments]);

    // Normalize team data
    const assignedUsers = useMemo(() => {
        const source = teamAssignments.length
            ? teamAssignments
            : (warehouse?.assignedUsers || []);

        return source
            .map((assignment) => {
                const user = assignment.user || assignment;

                return {
                    ...user,
                    id: user.id ?? assignment.userId,
                    assignmentUserId: assignment.userId ?? user.id,
                    roleId: Number(user.roleId),
                };
            })
            .filter((user) => user.roleId === 5);
    }, [teamAssignments, warehouse]);

    const inventory = Array.isArray(warehouse?.inventory)
        ? warehouse.inventory
        : [];

    const lowStockItems = Array.isArray(warehouse?.lowStockItems)
        ? warehouse.lowStockItems
        : [];

    const summary = warehouse?.inventorySummary || {
        totalProducts: inventory.length,
        totalInventoryUnits: inventory.reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        ),
        lowStockCount: lowStockItems.length,
    };

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
    };

    // Load staff created/managed by this Inventory Manager
    const openStaffModal = async (mode = "create", staff = null) => {
        setModalMode(mode);
        setEditingStaff(staff);
        setShowStaffModal(true);
        setActionError("");
        setSuccessMessage("");
        setSelectedStaffId("");

        if (mode === "edit" && staff) {
            setStaffForm({
                name: staff.name || "",
                email: staff.email || "",
                password: "",
            });
            return;
        }

        setStaffForm({
            name: "",
            email: "",
            password: "",
        });

        if (mode === "assign") {
            try {
                const response = await api.get("/user/staff");

                const staffList = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                const assignedIds = new Set(
                    assignedUsers.map((user) => Number(user.id))
                );

                setAvailableStaff(
                    staffList.filter(
                        (staffMember) =>
                            Number(staffMember.roleId) === 5 &&
                            !assignedIds.has(Number(staffMember.id))
                    )
                );
            } catch (err) {
                setActionError(
                    getErrorMessage(err, "Unable to load available staff.")
                );
            }
        }
    };

    // Create staff and assign to current warehouse
    const handleCreateStaff = async (event) => {
        event.preventDefault();

        if (!staffForm.name.trim() || !staffForm.email.trim() || !staffForm.password) {
            setActionError("Please fill all required fields.");
            return;
        }

        setBusy(true);
        setActionError("");

        try {
            const createResponse = await api.post("/user/staff", {
                name: staffForm.name.trim(),
                email: staffForm.email.trim().toLowerCase(),
                password: staffForm.password,
                warehouseId: Number(id),
            });

            if (createResponse.data?.success === false) {
                throw new Error(createResponse.data.message);
            }

            // If the staff creation endpoint returns a user ID but does not
            // create the assignment automatically, assign it here.
            const createdUser = createResponse.data?.data;
            const createdUserId = createdUser?.id;

            if (createdUserId) {
                try {
                    await api.post("/userWarehouse", {
                        userId: Number(createdUserId),
                        warehouseId: Number(id),
                    });
                } catch (assignmentError) {
                    // Do not hide a possible duplicate/already-created assignment.
                    throw new Error(
                        `Staff created, but assignment failed: ${getErrorMessage(
                            assignmentError,
                            "Please check the warehouse assignment."
                        )}`
                    );
                }
            }

            setSuccessMessage("Warehouse Staff created successfully.");
            setShowStaffModal(false);

            await Promise.all([
                loadTeamAssignments(),
                loadDetails(true),
            ]);
        } catch (err) {
            setActionError(
                getErrorMessage(err, "Unable to create Warehouse Staff.")
            );
        } finally {
            setBusy(false);
        }
    };

    // Assign an existing Warehouse Staff member
    const handleAssignStaff = async (event) => {
        event.preventDefault();

        if (!selectedStaffId) {
            setActionError("Please select a staff member.");
            return;
        }

        setBusy(true);
        setActionError("");

        try {
            const response = await api.post("/userWarehouse", {
                userId: Number(selectedStaffId),
                warehouseId: Number(id),
            });

            if (response.data?.success === false) {
                throw new Error(response.data?.message || "Assignment failed.");
            }

            setSuccessMessage("Staff assigned successfully.");
            setShowStaffModal(false);

            await Promise.all([
                loadTeamAssignments(),
                loadDetails(true),
            ]);
        } catch (err) {
            setActionError(
                getErrorMessage(err, "Unable to assign staff.")
            );
        } finally {
            setBusy(false);
        }
    };

    // Edit Warehouse Staff
    const handleUpdateStaff = async (event) => {
        event.preventDefault();

        if (!editingStaff?.id) return;

        setBusy(true);
        setActionError("");

        try {
            const response = await api.put(
                `/user/staff/${editingStaff.id}`,
                {
                    name: staffForm.name.trim(),
                    email: staffForm.email.trim().toLowerCase(),
                }
            );

            if (response.data?.success === false) {
                throw new Error(response.data?.message || "Update failed.");
            }

            setSuccessMessage("Staff details updated successfully.");
            setShowStaffModal(false);

            await Promise.all([
                loadTeamAssignments(),
                loadDetails(true),
            ]);
        } catch (err) {
            setActionError(
                getErrorMessage(err, "Unable to update staff details.")
            );
        } finally {
            setBusy(false);
        }
    };

    // Unassign staff from this warehouse (account remains active)
    const handleUnassignStaff = async (staffId) => {
        const confirmed = window.confirm(
            "Remove this staff member from this warehouse? Their account will not be deleted."
        );

        if (!confirmed) return;

        setRemovingId(staffId);
        setActionError("");
        setSuccessMessage("");

        try {
            const response = await api.delete(
                `/userWarehouse/user/${staffId}/warehouse/${id}`
            );

            if (response.data?.success === false) {
                throw new Error(response.data?.message || "Unassignment failed.");
            }

            setSuccessMessage("Staff removed from this warehouse.");
            await Promise.all([
                loadTeamAssignments(),
                loadDetails(true),
            ]);
        } catch (err) {
            setActionError(
                getErrorMessage(err, "Unable to remove staff assignment.")
            );
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-[1600px] space-y-6 pb-10">

            {/* Header */}
            <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-sm sm:p-8">
                <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <button
                            onClick={() => router.push("/inventory-manager/warehouses")}
                            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
                        >
                            <Icon name="back" size={17} />
                            Back to warehouses
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <Icon name="warehouse" size={28} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                    Warehouse profile · #{id}
                                </p>

                                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                    {loading
                                        ? "Loading warehouse..."
                                        : warehouse?.name || "Warehouse details"}
                                </h1>

                                {warehouse && (
                                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                                        <span className="flex items-center gap-2">
                                            <Icon name="pin" size={16} />
                                            {warehouse.location || "Location unavailable"}
                                        </span>

                                        <span className="flex items-center gap-2">
                                            <Icon name="calendar" size={16} />
                                            Created {formatDate(warehouse.createdAt)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            loadDetails(true);
                            loadTeamAssignments();
                        }}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-50"
                    >
                        <Icon
                            name="refresh"
                            size={17}
                        />
                        {refreshing ? "Refreshing..." : "Refresh data"}
                    </button>
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-bold text-rose-900">
                            Unable to load warehouse details
                        </p>
                        <p className="mt-1 text-sm text-rose-700">{error}</p>
                    </div>

                    <button
                        onClick={() => loadDetails()}
                        className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-36 animate-pulse rounded-2xl border bg-white"
                        />
                    ))}
                </div>
            ) : warehouse && !error ? (
                <>
                    {/* Summary cards */}
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <SummaryCard
                            title="Unique products"
                            value={summary.totalProducts ?? 0}
                            note="Products stocked at this location"
                            icon="package"
                            tone="blue"
                        />

                        <SummaryCard
                            title="Total stock units"
                            value={Number(
                                summary.totalInventoryUnits || 0
                            ).toLocaleString()}
                            note="Combined inventory quantity"
                            icon="boxes"
                            tone="violet"
                        />

                        <SummaryCard
                            title="Low-stock products"
                            value={summary.lowStockCount ?? lowStockItems.length}
                            note="At or below reorder level"
                            icon="alert"
                            tone="amber"
                        />
                    </section>

                    {/* Inventory overview */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Inventory overview
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Product quantities and reorder thresholds.
                                </p>
                            </div>

                            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                                {inventory.length} records
                            </span>
                        </div>

                        {inventory.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <Icon name="package" size={30} />
                                <h3 className="mt-3 font-bold text-slate-900">
                                    No inventory recorded
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    This warehouse has no inventory records yet.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px] text-left">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Product</th>
                                            <th className="px-5 py-4">SKU</th>
                                            <th className="px-5 py-4 text-right">Available units</th>
                                            <th className="px-5 py-4 text-right">Reorder level</th>
                                            <th className="px-5 py-4">Status</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {inventory.map((item) => {
                                            const isLow =
                                                Number(item.quantity) <=
                                                Number(item.reorderLevel);

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-slate-900">
                                                            {item.product?.name ||
                                                                `Product #${item.productId}`}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            ID #{item.productId}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm text-slate-600">
                                                        {item.product?.sku || "—"}
                                                    </td>

                                                    <td className="px-5 py-4 text-right font-bold tabular-nums text-slate-900">
                                                        {Number(item.quantity || 0).toLocaleString()}
                                                    </td>

                                                    <td className="px-5 py-4 text-right text-sm text-slate-600">
                                                        {Number(item.reorderLevel || 0).toLocaleString()}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`rounded-full border px-3 py-1 text-xs font-bold ${isLow
                                                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                                                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                                }`}
                                                        >
                                                            {isLow ? "Low stock" : "In stock"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Low stock and team */}
                    <section className="grid gap-5 xl:grid-cols-2">

                        {/* Low stock */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                                    <Icon name="alert" size={22} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-slate-900">
                                        Low-stock alerts
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Products at or below reorder level.
                                    </p>
                                </div>
                            </div>

                            {lowStockItems.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                        <Icon name="check" size={25} />
                                    </div>
                                    <p className="mt-3 font-semibold text-slate-900">
                                        No low-stock products
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        All products are above their reorder levels.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {lowStockItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between gap-4 px-5 py-4"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {item.product?.name ||
                                                        `Product #${item.productId}`}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {item.product?.sku || "SKU unavailable"}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-amber-700">
                                                    {item.quantity} left
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Reorder at {item.reorderLevel}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assigned staff */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                                        <Icon name="users" size={22} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-slate-900">
                                            Warehouse Staff
                                        </h2>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {assignedUsers.length} assigned staff
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => openStaffModal("assign")}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50"
                                    >
                                        <Icon name="users" size={16} />
                                        Assign existing
                                    </button>

                                    <button
                                        onClick={() => openStaffModal("create")}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                        <Icon name="plus" size={16} />
                                        Add staff
                                    </button>
                                </div>
                            </div>

                            {(successMessage || actionError) && (
                                <div
                                    className={`mx-5 mt-4 rounded-xl border px-4 py-3 text-sm ${actionError
                                            ? "border-rose-200 bg-rose-50 text-rose-800"
                                            : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        }`}
                                >
                                    {actionError || successMessage}
                                </div>
                            )}

                            {teamLoading ? (
                                <div className="px-5 py-12 text-center text-sm text-slate-500">
                                    Loading staff...
                                </div>
                            ) : assignedUsers.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <Icon name="users" size={28} />
                                    <p className="mt-3 font-semibold text-slate-900">
                                        No staff assigned
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Assign existing staff or create a new staff member.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {assignedUsers.map((staff) => (
                                        <div
                                            key={staff.id}
                                            className="flex items-start gap-3 px-5 py-4"
                                        >
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                {(staff.name || "S")
                                                    .split(" ")
                                                    .slice(0, 2)
                                                    .map((part) => part[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-slate-900">
                                                    {staff.name}
                                                </p>

                                                <p className="mt-1 flex items-center gap-2 break-all text-xs text-slate-500">
                                                    <Icon name="mail" size={13} />
                                                    {staff.email}
                                                </p>

                                                <span className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                    Warehouse Staff
                                                </span>
                                            </div>

                                            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                                                <button
                                                    onClick={() => openStaffModal("edit", staff)}
                                                    title="Edit staff"
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                                >
                                                    <Icon name="edit" size={16} />
                                                </button>

                                                <button
                                                    onClick={() => handleUnassignStaff(staff.id)}
                                                    disabled={removingId === staff.id}
                                                    title="Unassign staff"
                                                    className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                                >
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Warehouse information */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">
                            Warehouse information
                        </h2>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <Icon name="pin" size={15} />
                                    Full address
                                </p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                                    {warehouse.address || "Address unavailable"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <Icon name="calendar" size={15} />
                                    Record dates
                                </p>
                                <p className="mt-3 text-sm text-slate-700">
                                    Created:{" "}
                                    <strong>{formatDate(warehouse.createdAt)}</strong>
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                    Last updated:{" "}
                                    <strong>{formatDate(warehouse.updatedAt)}</strong>
                                </p>
                            </div>
                        </div>
                    </section>
                </>
            ) : null}

            {/* Staff modal */}
            {showStaffModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                    {warehouse?.name}
                                </p>

                                <h2 className="mt-2 text-xl font-bold text-slate-900">
                                    {modalMode === "create"
                                        ? "Create Warehouse Staff"
                                        : modalMode === "assign"
                                            ? "Assign Existing Staff"
                                            : "Edit Staff Details"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Only Warehouse Staff can be managed here.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowStaffModal(false)}
                                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        {actionError && (
                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                {actionError}
                            </div>
                        )}

                        {modalMode === "assign" ? (
                            <form
                                onSubmit={handleAssignStaff}
                                className="mt-6 space-y-5"
                            >
                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                                        Select Warehouse Staff
                                    </span>

                                    <select
                                        value={selectedStaffId}
                                        onChange={(event) =>
                                            setSelectedStaffId(event.target.value)
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="">Choose staff member</option>

                                        {availableStaff.map((staff) => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name} · {staff.email}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {availableStaff.length === 0 && (
                                    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                                        No available staff found. Create a new staff member instead.
                                    </p>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowStaffModal(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={busy || !selectedStaffId}
                                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {busy ? "Assigning..." : "Assign Staff"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form
                                onSubmit={
                                    modalMode === "edit"
                                        ? handleUpdateStaff
                                        : handleCreateStaff
                                }
                                className="mt-6 space-y-4"
                            >
                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                                        Full name
                                    </span>

                                    <input
                                        type="text"
                                        required
                                        minLength={2}
                                        value={staffForm.name}
                                        onChange={(event) =>
                                            setStaffForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter full name"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                                        Email address
                                    </span>

                                    <input
                                        type="email"
                                        required
                                        value={staffForm.email}
                                        onChange={(event) =>
                                            setStaffForm((current) => ({
                                                ...current,
                                                email: event.target.value,
                                            }))
                                        }
                                        placeholder="staff@company.com"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </label>

                                {modalMode === "create" && (
                                    <label className="block">
                                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                                            Temporary password
                                        </span>

                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={staffForm.password}
                                            onChange={(event) =>
                                                setStaffForm((current) => ({
                                                    ...current,
                                                    password: event.target.value,
                                                }))
                                            }
                                            placeholder="Minimum 6 characters"
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        />
                                    </label>
                                )}

                                <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                                    Role will remain <strong>Warehouse Staff (Role 5)</strong>.
                                    Inventory Managers cannot change staff roles.
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowStaffModal(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={busy}
                                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {busy
                                            ? "Please wait..."
                                            : modalMode === "edit"
                                                ? "Update Staff"
                                                : "Create Staff"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WarehouseDetailsPage() {
    return (
        <AuthGuard allowedRoles={[4]}>
            <WarehouseDetailsContent />
        </AuthGuard>
    );
}
