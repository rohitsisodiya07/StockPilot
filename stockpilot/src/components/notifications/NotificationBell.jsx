"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
    Bell,
    AlertTriangle,
    CheckCircle2,
    Package,
    Truck,
    ArrowRight,
    RefreshCw,
    X,
} from "lucide-react";

export default function NotificationBell({ role = "admin" }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const lastFetchRef = useRef(0);

    const basePath =
        role === "admin"
            ? "/admin"
            : role === "inventory-manager"
            ? "/inventory-manager"
            : "/warehouse";

    const fetchNotifications = useCallback(async () => {
        // Prevent duplicate fetches within 2.5 seconds
        const now = Date.now();
        if (now - lastFetchRef.current < 2500) return;
        lastFetchRef.current = now;

        try {
            setLoading(true);
            const res = await api.get("/notifications");
            const data = res.data?.data || {};

            const dbNotifications = Array.isArray(data.notifications)
                ? data.notifications
                : [];
            const unread = data.unreadCount || 0;

            const items = dbNotifications.map((n) => {
                let iconType = "info";
                if (n.type === "LOW_STOCK" || n.type === "WARNING") iconType = "warning";
                else if (n.type === "PO_RECEIVED" || n.type === "TRANSFER") iconType = "success";

                return {
                    id: n.id,
                    type: iconType,
                    title: n.title,
                    message: n.message,
                    href: n.link || `${basePath}/inventory`,
                    time: n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                          })
                        : "Just now",
                    isRead: n.isRead,
                };
            });

            setNotifications(items);
            setUnreadCount(unread);
        } catch (err) {
            console.warn("Notifications load fallback:", err.message);
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    useEffect(() => {
        fetchNotifications();
        // Refresh every 45s
        const interval = setInterval(fetchNotifications, 45000);

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            setUnreadCount(0);
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            await api.patch("/notifications", { markAll: true });
        } catch (e) {
            console.error("Mark read error:", e);
        }
    };

    const markItemRead = async (id) => {
        try {
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === id ? { ...item, isRead: true } : item
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            await api.patch("/notifications", { notificationId: id });
        } catch {}
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-label="View notifications"
                className="relative flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Live Alerts
                            </span>
                            {unreadCount > 0 ? (
                                <span className="rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold">
                                    {unreadCount} new
                                </span>
                            ) : (
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                                    All clear
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={fetchNotifications}
                                title="Refresh alerts"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            >
                                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {loading && notifications.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">Loading alerts...</div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All Caught Up</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">No critical stock or order alerts right now.</p>
                            </div>
                        ) : (
                            notifications.map((item) => {
                                const isWarn = item.type === "warning";
                                const isSuccess = item.type === "success";

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => {
                                            if (!item.isRead) markItemRead(item.id);
                                            setOpen(false);
                                        }}
                                        className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition block ${
                                            !item.isRead ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                                        }`}
                                    >
                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                                                isWarn
                                                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                                    : isSuccess
                                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                                            }`}
                                        >
                                            {isWarn ? (
                                                <AlertTriangle className="h-4 w-4" />
                                            ) : isSuccess ? (
                                                <Package className="h-4 w-4" />
                                            ) : (
                                                <Truck className="h-4 w-4" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                    {item.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {item.time}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                {item.message}
                                            </p>
                                        </div>

                                        {!item.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 shrink-0" />
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 p-2 text-center bg-slate-50/40 dark:bg-slate-800/30">
                        <Link
                            href={`${basePath}/inventory`}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-1"
                        >
                            <span>Inspect Full Inventory & Stock Alerts</span>
                            <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
