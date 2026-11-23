"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

function Icon({ name, size = 20 }) {
    const icons = {
        warehouse: (
            <>
                <path d="m3 10 9-7 9 7v10H3V10Z" />
                <path d="M9 21v-7h6v7M3 10h18" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 7v5h-5M4 17v-5h5" />
                <path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5a7 7 0 0 0 11.7-2" />
            </>
        ),
        map: (
            <>
                <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
                <path d="M9 3v15M15 6v15" />
            </>
        ),
        eye: (
            <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </>
        ),
        box: (
            <>
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" />
            </>
        ),
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
        >
            {icons[name] || icons.warehouse}
        </svg>
    );
}

function SummaryCard({ title, value, note, icon, color }) {
    const colors = {
        blue: "bg-blue-50 text-blue-700",
        violet: "bg-violet-50 text-violet-700",
        amber: "bg-amber-50 text-amber-700",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-3 text-2xl font-bold text-slate-900">
                        {value}
                    </h3>

                    <p className="mt-2 text-xs text-slate-500">
                        {note}
                    </p>
                </div>

                <div className={`rounded-xl p-3 ${colors[color]}`}>
                    <Icon name={icon} size={23} />
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
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const loadWarehouses = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await api.get("/warehouse");

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Unable to load warehouses."
                );
            }

            const result = response.data?.data;

            const warehouseList = Array.isArray(result)
                ? result
                : Array.isArray(result?.warehouses)
                    ? result.warehouses
                    : [];

            setWarehouses(warehouseList);
        } catch (err) {
            console.error("Warehouse loading error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong while loading warehouses."
            );
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
            [
                warehouse.name,
                warehouse.location,
                warehouse.address,
                warehouse.id,
            ].some((value) =>
                String(value || "").toLowerCase().includes(query)
            )
        );
    }, [warehouses, search]);

    return (
        <div className="mx-auto max-w-[1600px] space-y-6 pb-8">

            {/* Header */}
            <section className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-sm">
                <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <Icon name="warehouse" size={26} />
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                                    Inventory Management
                                </p>

                                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                                    My Warehouses
                                </h1>
                            </div>
                        </div>

                        <p className="mt-4 max-w-xl text-sm text-slate-600">
                            View your assigned warehouses, check their
                            locations and monitor warehouse inventory.
                        </p>
                    </div>

                    <button
                        onClick={() => loadWarehouses(true)}
                        disabled={loading || refreshing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                    >
                        <span className={refreshing ? "animate-spin" : ""}>
                            <Icon name="refresh" size={17} />
                        </span>
                        Refresh
                    </button>
                </div>
            </section>

            {/* Summary */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                    title="Assigned Warehouses"
                    value={warehouses.length}
                    note="Warehouses assigned to your account"
                    icon="warehouse"
                    color="blue"
                />

                <SummaryCard
                    title="Search Results"
                    value={filteredWarehouses.length}
                    note="Matching warehouse records"
                    icon="search"
                    color="violet"
                />

                <SummaryCard
                    title="Access Level"
                    value="Manager"
                    note="View and manage permitted operations"
                    icon="box"
                    color="amber"
                />
            </section>

            {/* Warehouse Table */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-950">
                            Warehouse Directory
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your assigned warehouse locations.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon name="search" size={18} />
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search warehouse..."
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {error && (
                    <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm font-semibold text-rose-800">
                            Unable to load warehouses
                        </p>

                        <p className="mt-1 text-sm text-rose-700">
                            {error}
                        </p>

                        <button
                            onClick={() => loadWarehouses()}
                            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4 p-6">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-16 animate-pulse rounded-lg bg-slate-100"
                            />
                        ))}
                    </div>
                ) : !error && filteredWarehouses.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Icon name="warehouse" size={28} />
                        </div>

                        <h3 className="mt-4 text-base font-bold text-slate-900">
                            {search
                                ? "No matching warehouses"
                                : "No warehouses assigned"}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            {search
                                ? "Try searching with another name or location."
                                : "No warehouse has been assigned to your account yet."}
                        </p>
                    </div>
                ) : !error && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead>
                                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4 font-bold">
                                        Warehouse
                                    </th>

                                    <th className="px-6 py-4 font-bold">
                                        Location
                                    </th>

                                    <th className="px-6 py-4 font-bold">
                                        Address
                                    </th>

                                    <th className="px-6 py-4 text-right font-bold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredWarehouses.map((warehouse) => (
                                    <tr
                                        key={warehouse.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                                    <Icon
                                                        name="warehouse"
                                                        size={20}
                                                    />
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {warehouse.name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Warehouse #{warehouse.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                <span className="text-blue-600">
                                                    <Icon name="map" size={16} />
                                                </span>

                                                {warehouse.location || "—"}
                                            </span>
                                        </td>

                                        <td className="max-w-xs px-6 py-4">
                                            <p className="truncate text-sm text-slate-600">
                                                {warehouse.address || "—"}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/inventory-manager/warehouses/${warehouse.id}`
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                            >
                                                <Icon name="eye" size={15} />
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && filteredWarehouses.length > 0 && (
                    <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 text-xs text-slate-500 sm:flex-row">
                        <span>
                            Showing {filteredWarehouses.length} of {warehouses.length} warehouses
                        </span>

                        <span>
                            Inventory Manager Access
                        </span>
                    </div>
                )}
            </section>
        </div>
    );
}

export default function InventoryManagerWarehousesPage() {
    return (
        <AuthGuard allowedRoles={[4]}>
            <WarehouseManagementContent />
        </AuthGuard>
    );
}