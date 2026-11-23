"use client";

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";
import {
    Shield,
    Search,
    RefreshCw,
    Filter,
    Calendar,
    User,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    Tag,
} from "lucide-react";

const ACTION_COLORS = {
    CREATE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    UPDATE: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    DELETE: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    TRANSFER: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    REORDER: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    RECEIVE: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    DISPATCH: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    LOGIN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [entityFilter, setEntityFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchLogs = useCallback(async (targetPage = page) => {
        try {
            setLoading(true);
            const params = {
                page: targetPage,
                limit: 15,
            };
            if (actionFilter !== "ALL") params.action = actionFilter;
            if (entityFilter !== "ALL") params.entity = entityFilter;
            if (search.trim()) params.search = search.trim();

            const res = await api.get("/audit-logs", { params });
            if (res.data?.success) {
                setLogs(res.data.data.logs || []);
                setTotalPages(res.data.data.pagination.totalPages || 1);
                setTotalRecords(res.data.data.pagination.totalRecords || 0);
                setPage(targetPage);
            }
        } catch (err) {
            console.error("Failed to load audit logs:", err);
        } finally {
            setLoading(false);
        }
    }, [actionFilter, entityFilter, search, page]);

    useEffect(() => {
        fetchLogs(1);
    }, [actionFilter, entityFilter]);

    const formatDetails = (raw) => {
        if (!raw) return "—";
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object") {
                return (
                    <div className="space-y-0.5 text-[11px]">
                        {parsed.message && <p className="font-semibold text-slate-900 dark:text-white">{parsed.message}</p>}
                        {Object.entries(parsed)
                            .filter(([k]) => k !== "message")
                            .map(([k, v]) => (
                                <span key={k} className="inline-block mr-2 text-[10px] text-slate-500 dark:text-slate-400">
                                    <strong className="text-slate-700 dark:text-slate-300">{k}:</strong> {String(v)}
                                </span>
                            ))}
                    </div>
                );
            }
        } catch {}
        return <span className="text-[11px] text-slate-600 dark:text-slate-300">{raw}</span>;
    };

    return (
        <AuthGuard allowedRoles={[1]}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-white/10">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-2">
                            <Shield className="h-3.5 w-3.5" />
                            <span>Enterprise Governance</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            System Audit Logs
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-300">
                            Immutable activity timeline of user actions, order status changes, and stock operations.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchLogs(page)}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh Logs</span>
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            fetchLogs(1);
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                    >
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search details or entity..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                            />
                        </div>

                        {/* Action Filter */}
                        <div>
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">All Actions</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="REORDER">REORDER (1-Click)</option>
                                <option value="TRANSFER">TRANSFER</option>
                                <option value="RECEIVE">RECEIVE</option>
                                <option value="DISPATCH">DISPATCH</option>
                            </select>
                        </div>

                        {/* Entity Filter */}
                        <div>
                            <select
                                value={entityFilter}
                                onChange={(e) => setEntityFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">All Entities</option>
                                <option value="PURCHASE_ORDER">Purchase Orders</option>
                                <option value="SALES_ORDER">Sales Orders</option>
                                <option value="STOCK_TRANSFER">Stock Transfers</option>
                                <option value="PRODUCT">Products</option>
                                <option value="INVENTORY">Inventory</option>
                                <option value="USER">Users</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                            Filter Logs
                        </button>
                    </form>
                </div>

                {/* Logs Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-xs">
                            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Timestamp</th>
                                    <th className="px-4 py-3 font-semibold">Actor / User</th>
                                    <th className="px-4 py-3 font-semibold">Action</th>
                                    <th className="px-4 py-3 font-semibold">Target Entity</th>
                                    <th className="px-4 py-3 font-semibold">Details</th>
                                    <th className="px-4 py-3 font-semibold">IP Address</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <span className="mx-auto mb-2 block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                            Loading audit records...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                            <Shield className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                                            <p className="font-semibold text-slate-700 dark:text-slate-300">No audit records found</p>
                                            <p className="text-[11px] mt-0.5">Try clearing filters or search terms.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const actionColor = ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700";

                                        return (
                                            <tr key={log.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {log.createdAt
                                                        ? new Date(log.createdAt).toLocaleString("en-IN", {
                                                              day: "2-digit",
                                                              month: "short",
                                                              year: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                              second: "2-digit",
                                                          })
                                                        : "—"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                                            {(log.user?.name || "U").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                                                                {log.user?.name || `User #${log.userId}`}
                                                            </p>
                                                            <p className="truncate text-[10px] text-slate-400">
                                                                {log.user?.email || ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${actionColor}`}>
                                                        {log.action}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                                    {log.entity} {log.entityId ? `#${log.entityId}` : ""}
                                                </td>

                                                <td className="px-4 py-3 max-w-md">
                                                    {formatDetails(log.details)}
                                                </td>

                                                <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                                                    {log.ipAddress || "127.0.0.1"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 gap-3">
                        <div>
                            Showing page <strong className="text-slate-800 dark:text-white">{page}</strong> of{" "}
                            <strong className="text-slate-800 dark:text-white">{totalPages}</strong> ({totalRecords} total events)
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fetchLogs(page - 1)}
                                disabled={page <= 1 || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                                <span>Previous</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => fetchLogs(page + 1)}
                                disabled={page >= totalPages || loading}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
