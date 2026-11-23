"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
    CheckSquare,
    Clock,
    AlertCircle,
    CheckCircle2,
    Play,
    Plus,
    Calendar,
    Warehouse,
    Filter,
    Search,
    RefreshCw,
    X,
    FileText,
} from "lucide-react";

export default function WarehouseTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("ACTIVE"); // "ACTIVE" | "HISTORY"
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, total: 0 });

    // Modals
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [completionNotes, setCompletionNotes] = useState("");
    const [submittingAction, setSubmittingAction] = useState(false);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newPriority, setNewPriority] = useState("MEDIUM");
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWhId, setSelectedWhId] = useState("");
    const [submittingCreate, setSubmittingCreate] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchTasks = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMsg("");

        try {
            const statusParam =
                activeTab === "ACTIVE" ? "" : "&status=COMPLETED";
            const priorityParam =
                priorityFilter !== "ALL" ? `&priority=${priorityFilter}` : "";

            const res = await api.get(`/warehouse/tasks?limit=50${statusParam}${priorityParam}`);
            if (res.data?.success) {
                const allData = res.data.data || [];
                // If active tab, filter out COMPLETED/CANCELLED
                if (activeTab === "ACTIVE") {
                    setTasks(allData.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS"));
                } else {
                    setTasks(allData.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED"));
                }
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setErrorMsg(err.response?.data?.message || "Failed to load tasks");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, priorityFilter]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Fetch user's assigned warehouses for self-task creation
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

    const handleStartTask = async (taskId) => {
        try {
            setSubmittingAction(true);
            await api.patch(`/warehouse/tasks/${taskId}`, { status: "IN_PROGRESS" });
            setSuccessMsg("Task started!");
            fetchTasks(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to update task");
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleCompleteTask = async (e) => {
        e.preventDefault();
        if (!selectedTask) return;
        try {
            setSubmittingAction(true);
            await api.patch(`/warehouse/tasks/${selectedTask.id}`, {
                status: "COMPLETED",
                completionNotes: completionNotes.trim() || undefined,
            });
            setSuccessMsg("Task marked as COMPLETED!");
            setCompleteModalOpen(false);
            setSelectedTask(null);
            setCompletionNotes("");
            fetchTasks(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to complete task");
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleCreateSelfTask = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) {
            setErrorMsg("Task title is required");
            return;
        }

        try {
            setSubmittingCreate(true);
            await api.post("/warehouse/tasks", {
                title: newTitle.trim(),
                description: newDescription.trim() || undefined,
                priority: newPriority,
                warehouseId: selectedWhId ? Number(selectedWhId) : undefined,
            });
            setSuccessMsg("New task created successfully!");
            setCreateModalOpen(false);
            setNewTitle("");
            setNewDescription("");
            fetchTasks(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to create task");
        } finally {
            setSubmittingCreate(false);
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case "URGENT":
                return "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900";
            case "HIGH":
                return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900";
            case "MEDIUM":
                return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-900";
            default:
                return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        My Tasks & Floor Work
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View assigned warehouse assignments, update status, and track your completed work history.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchTasks(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
                    >
                        <Plus className="h-4 w-4" />
                        New Floor Task
                    </button>
                </div>
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

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Tasks</p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Assigned</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{stats.total}</p>
                </div>
            </div>

            {/* Tabs & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("ACTIVE")}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                            activeTab === "ACTIVE"
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        Active Tasks ({stats.pending + stats.inProgress})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("HISTORY")}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                            activeTab === "HISTORY"
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        Work History ({stats.completed})
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500">Priority:</span>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
            </div>

            {/* Tasks List */}
            {loading ? (
                <div className="p-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <p className="text-xs">Loading tasks...</p>
                </div>
            ) : tasks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
                    <CheckSquare className="h-10 w-10 mx-auto text-slate-400 mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {activeTab === "ACTIVE" ? "No active tasks right now" : "No completed tasks in history"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {activeTab === "ACTIVE"
                            ? "You're all caught up! Create a new floor task above if needed."
                            : "Tasks you complete will appear here as your work history."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                        >
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                        {task.title}
                                    </h3>
                                    <span
                                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getPriorityBadge(
                                            task.priority
                                        )}`}
                                    >
                                        {task.priority}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                        {task.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                                    {task.warehouse && (
                                        <span className="flex items-center gap-1">
                                            <Warehouse className="h-3.5 w-3.5" />
                                            {task.warehouse.name}
                                        </span>
                                    )}

                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {task.createdAt
                                            ? new Date(task.createdAt).toLocaleDateString("en-IN", {
                                                  day: "2-digit",
                                                  month: "short",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "N/A"}
                                    </span>

                                    <span
                                        className={`font-semibold ${
                                            task.status === "COMPLETED"
                                                ? "text-emerald-500"
                                                : task.status === "IN_PROGRESS"
                                                ? "text-blue-500"
                                                : "text-amber-500"
                                        }`}
                                    >
                                        ● {task.status.replace("_", " ")}
                                    </span>
                                </div>

                                {task.completionNotes && (
                                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">Notes: </span>
                                        {task.completionNotes}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {task.status !== "COMPLETED" && (
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {task.status === "PENDING" && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartTask(task.id)}
                                            disabled={submittingAction}
                                            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition flex items-center justify-center gap-1.5"
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                            Start Task
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setCompleteModalOpen(true);
                                        }}
                                        disabled={submittingAction}
                                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Mark Done
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Complete Task Modal */}
            {completeModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                Complete Task
                            </h3>
                            <button
                                onClick={() => {
                                    setCompleteModalOpen(false);
                                    setSelectedTask(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Task: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTask.title}</span>
                        </p>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Handover / Completion Notes (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                placeholder="e.g. Received all 50 boxes and placed on Rack B-2..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCompleteModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleCompleteTask}
                                disabled={submittingAction}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            >
                                {submittingAction ? "Completing..." : "Confirm Complete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Self Task Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                    <form
                        onSubmit={handleCreateSelfTask}
                        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Plus className="h-5 w-5 text-emerald-600" />
                                Create Floor Task
                            </h3>
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Task Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g. Clean & count aisle 4 pallets"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Description / Notes
                            </label>
                            <textarea
                                rows={2}
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                placeholder="Optional details..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Priority
                                </label>
                                <select
                                    value={newPriority}
                                    onChange={(e) => setNewPriority(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Warehouse
                                </label>
                                <select
                                    value={selectedWhId}
                                    onChange={(e) => setSelectedWhId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                                >
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submittingCreate}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            >
                                {submittingCreate ? "Creating..." : "Create Task"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
