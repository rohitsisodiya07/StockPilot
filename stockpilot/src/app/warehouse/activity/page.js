"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
    History,
    RefreshCw,
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    RotateCcw,
    Shield,
    Filter,
} from "lucide-react";

export default function WarehouseActivityPage() {
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState("ALL");
    const [errorMsg, setErrorMsg] = useState("");

    const fetchActivity = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        try {
            const res = await api.get("/warehouse/activity");
            if (res.data?.success) {
                setTimeline(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load activity:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load activity trail");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const filteredTimeline = timeline.filter((item) => {
        if (filterType === "ALL") return true;
        return item.type === filterType;
    });

    const getIcon = (type, action) => {
        switch (type) {
            case "MOVEMENT":
                return action === "STOCK_IN" ? (
                    <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                    <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                );
            case "SHIFT":
                return <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
            case "INSPECTION":
                return <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
            default:
                return <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />;
        }
    };

    const getBadgeStyle = (type) => {
        switch (type) {
            case "MOVEMENT":
                return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
            case "SHIFT":
                return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
            case "INSPECTION":
                return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        My Activity Trail
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Personal chronological timeline of all your floor operations, shifts, stock moves, and inspections.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fetchActivity(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {errorMsg}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {[
                    { key: "ALL", label: "All Activities" },
                    { key: "MOVEMENT", label: "Stock Moves" },
                    { key: "SHIFT", label: "Shifts & Attendance" },
                    { key: "INSPECTION", label: "Return Inspections" },
                    { key: "AUDIT", label: "Audits & Tasks" },
                ].map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilterType(f.key)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                            filterType === f.key
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs">Loading activity timeline...</p>
                    </div>
                ) : filteredTimeline.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No activity records found for this filter.</p>
                    </div>
                ) : (
                    <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-6">
                        {filteredTimeline.map((item) => (
                            <div key={item.id} className="relative pl-6 group">
                                {/* Dot Icon */}
                                <div className="absolute -left-[17px] top-1.5 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                                    {getIcon(item.type, item.action)}
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition space-y-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeStyle(
                                                    item.type
                                                )}`}
                                            >
                                                {item.type}
                                            </span>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                {item.title}
                                            </h4>
                                        </div>

                                        <span className="text-[11px] font-medium text-slate-400">
                                            {item.timestamp
                                                ? new Date(item.timestamp).toLocaleDateString("en-IN", {
                                                      day: "2-digit",
                                                      month: "short",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "N/A"}
                                        </span>
                                    </div>

                                    {item.details && (
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            {item.details}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
