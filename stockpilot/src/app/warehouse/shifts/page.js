"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
    Clock,
    Play,
    Square,
    CheckCircle2,
    Calendar,
    Warehouse,
    RefreshCw,
    X,
    FileText,
    TrendingUp,
} from "lucide-react";

export default function WarehouseShiftsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeShift, setActiveShift] = useState(null);
    const [pastShifts, setPastShifts] = useState([]);
    const [stats, setStats] = useState({ hoursThisWeek: "0.0", totalShiftsRecorded: 0 });

    const [warehouses, setWarehouses] = useState([]);
    const [selectedWhId, setSelectedWhId] = useState("");

    // Clock out modal
    const [clockOutModalOpen, setClockOutModalOpen] = useState(false);
    const [handoverNotes, setHandoverNotes] = useState("");
    const [submittingAction, setSubmittingAction] = useState(false);

    // Live timer
    const [elapsedTime, setElapsedTime] = useState("0h 0m");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchShiftData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        try {
            const res = await api.get("/warehouse/shifts");
            if (res.data?.success) {
                const { activeShift: active, pastShifts: past, stats: s } = res.data.data;
                setActiveShift(active);
                setPastShifts(past || []);
                if (s) setStats(s);
            }
        } catch (err) {
            console.error("Failed to load shifts:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load shift records");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchShiftData();
    }, [fetchShiftData]);

    // Load assigned warehouses
    useEffect(() => {
        const loadWhs = async () => {
            try {
                const userStr = sessionStorage.getItem("stockpilot_user");
                if (!userStr) return;
                const user = JSON.parse(userStr);
                const res = await api.get(`/userWarehouse/user/${user.id}`);
                const list = (res.data?.data || []).map((a) => a.warehouse || a).filter(Boolean);
                setWarehouses(list);
                if (list.length > 0) setSelectedWhId(String(list[0].id));
            } catch (err) {
                console.error("Failed to load warehouses:", err);
            }
        };
        loadWhs();
    }, []);

    // Live timer ticker for active shift
    useEffect(() => {
        if (!activeShift?.clockIn) return;

        const updateTimer = () => {
            const start = new Date(activeShift.clockIn).getTime();
            const now = Date.now();
            const diffMin = Math.max(0, Math.floor((now - start) / 60000));
            const hours = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            setElapsedTime(`${hours}h ${mins}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 30000); // every 30s
        return () => clearInterval(interval);
    }, [activeShift]);

    const handleClockIn = async () => {
        try {
            setSubmittingAction(true);
            setErrorMsg("");
            const res = await api.post("/warehouse/shifts", {
                action: "clock-in",
                warehouseId: selectedWhId ? Number(selectedWhId) : undefined,
            });
            if (res.data?.success) {
                setSuccessMsg("Shift started! You are now ON DUTY.");
                fetchShiftData(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to clock in");
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleClockOut = async (e) => {
        e.preventDefault();
        try {
            setSubmittingAction(true);
            setErrorMsg("");
            const res = await api.post("/warehouse/shifts", {
                action: "clock-out",
                notes: handoverNotes.trim() || undefined,
            });
            if (res.data?.success) {
                setSuccessMsg(res.data.message || "Shift ended successfully.");
                setClockOutModalOpen(false);
                setHandoverNotes("");
                fetchShiftData(true);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to clock out");
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        Shift & Attendance Tracker
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Clock in when arriving on floor, track active hours, and submit handover notes at end of shift.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fetchShiftData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Alert Messages */}
            {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")}><X className="h-4 w-4" /></button>
                </div>
            )}
            {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button onClick={() => setErrorMsg("")}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Live Shift Status Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            <span
                                className={`inline-flex h-3 w-3 rounded-full ${
                                    activeShift ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                                }`}
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                {activeShift ? "Active Shift In Progress" : "Currently Off Duty"}
                            </span>
                        </div>

                        <div className="flex items-baseline gap-3">
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                                {activeShift ? elapsedTime : "Not Clocked In"}
                            </h2>
                            {activeShift && (
                                <span className="text-xs text-slate-300">
                                    Since{" "}
                                    {new Date(activeShift.clockIn).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            )}
                        </div>

                        {activeShift?.warehouse && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                                <Warehouse className="h-3.5 w-3.5 text-emerald-400" />
                                Floor: {activeShift.warehouse.name} ({activeShift.warehouse.location || "Main"})
                            </p>
                        )}
                    </div>

                    {/* Clock In / Out Action */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {!activeShift ? (
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                {warehouses.length > 0 && (
                                    <select
                                        value={selectedWhId}
                                        onChange={(e) => setSelectedWhId(e.target.value)}
                                        className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-medium focus:outline-hidden"
                                    >
                                        {warehouses.map((wh) => (
                                            <option key={wh.id} value={wh.id}>
                                                {wh.name}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <button
                                    type="button"
                                    onClick={handleClockIn}
                                    disabled={submittingAction}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Play className="h-4 w-4 fill-current" />
                                    Clock In (Start Shift)
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setClockOutModalOpen(true)}
                                disabled={submittingAction}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <Square className="h-4 w-4 fill-current" />
                                Clock Out (End Shift)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Weekly Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hours This Week</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {stats.hoursThisWeek} hrs
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recorded Shifts</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                        {stats.totalShiftsRecorded}
                    </p>
                </div>
            </div>

            {/* Shift History Table */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        Attendance & Past Shifts Log
                    </h3>
                    <span className="text-xs text-slate-400">Last 20 records</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <p className="text-xs">Loading shift records...</p>
                    </div>
                ) : pastShifts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No completed shifts recorded yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Warehouse</th>
                                    <th className="py-3 px-4">Clock In</th>
                                    <th className="py-3 px-4">Clock Out</th>
                                    <th className="py-3 px-4">Duration</th>
                                    <th className="py-3 px-4">Handover Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {pastShifts.map((shift) => (
                                    <tr key={shift.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                            {new Date(shift.clockIn).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">
                                            {shift.warehouse?.name || "Floor"}
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(shift.clockIn).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td className="py-3 px-4">
                                            {shift.clockOut
                                                ? new Date(shift.clockOut).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "—"}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                                            {((shift.durationMinutes || 0) / 60).toFixed(1)} hrs
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                                            {shift.notes || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Clock Out Handover Notes Modal */}
            {clockOutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <form
                        onSubmit={handleClockOut}
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Square className="h-5 w-5 text-rose-500 fill-current" />
                                End Shift (Clock Out)
                            </h3>
                            <button
                                type="button"
                                onClick={() => setClockOutModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Current shift duration:{" "}
                            <span className="font-bold text-emerald-600">{elapsedTime}</span>
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Shift Handover Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={handoverNotes}
                                onChange={(e) => setHandoverNotes(e.target.value)}
                                placeholder="e.g. Unloaded PO #12, placed on pallet 4. Outbound SO #45 ready for courier pickup tomorrow morning..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setClockOutModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submittingAction}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                            >
                                {submittingAction ? "Clocking Out..." : "Confirm Clock Out"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
