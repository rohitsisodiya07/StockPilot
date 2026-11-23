
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import api from "@/lib/api";

const EMPTY_FORM = {
    name: "",
    description: "",
    status: "ACTIVE",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

function Icon({ name, size = 19, className = "" }) {
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
        tag: (
            <>
                <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
                <circle cx="7.5" cy="7.5" r=".8" />
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
        alert: (
            <>
                <path d="M12 9v4m0 4h.01" />
                <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        layers: (
            <>
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
            </>
        ),
    };

    return <svg {...common}>{paths[name] || paths.tag}</svg>;
}

function errorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function StatusBadge({ status }) {
    const active = String(status || "ACTIVE").toUpperCase() === "ACTIVE";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"
                    }`}
            />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

function CategoryModal({
    mode,
    category,
    saving,
    onClose,
    onSave,
}) {
    const [form, setForm] = useState(category || EMPTY_FORM);
    const [formError, setFormError] = useState("");

    useEffect(() => {
        setForm(category || EMPTY_FORM);
        setFormError("");
    }, [category]);

    const submit = async (event) => {
        event.preventDefault();
        setFormError("");

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: form.status,
        };

        if (payload.name.length < 2) {
            setFormError("Category name must be at least 2 characters.");
            return;
        }

        if (!["ACTIVE", "INACTIVE"].includes(payload.status)) {
            setFormError("Please select a valid status.");
            return;
        }

        try {
            await onSave(payload);
        } catch (error) {
            setFormError(errorMessage(error, "Could not save category."));
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-modal-title"
                className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                            <Icon name="tag" size={21} />
                        </div>

                        <div>
                            <h2
                                id="category-modal-title"
                                className="text-base font-bold text-slate-900"
                            >
                                {mode === "create"
                                    ? "Create Category"
                                    : "Edit Category"}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Organize products in your catalog.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
                    {formError && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-700"
                        >
                            <Icon name="alert" size={17} />
                            <span>{formError}</span>
                        </div>
                    )}

                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                            Category Name <span className="text-rose-500">*</span>
                        </span>

                        <input
                            name="name"
                            value={form.name || ""}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            required
                            minLength={2}
                            maxLength={100}
                            autoFocus
                            placeholder="e.g. Electronics"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                            Description
                        </span>

                        <textarea
                            value={form.description || ""}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                            rows={3}
                            maxLength={500}
                            placeholder="Write a short description..."
                            className={`${inputClass} resize-y`}
                        />

                        <p className="mt-1 text-right text-[10px] text-slate-400">
                            {(form.description || "").length}/500
                        </p>
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                            Status
                        </span>

                        <select
                            value={form.status || "ACTIVE"}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    status: event.target.value,
                                }))
                            }
                            className={inputClass}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </label>

                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : mode === "create"
                                    ? "Create Category"
                                    : "Save Changes"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function StatCard({ label, value, icon, color, description }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                    {label}
                </p>

                <div className={`rounded-xl p-2.5 ${color}`}>
                    <Icon name={icon} size={19} />
                </div>
            </div>

            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {value}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
                {description}
            </p>
        </div>
    );
}

function CategoryManagementContent() {
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [pageError, setPageError] = useState("");
    const [notice, setNotice] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [modal, setModal] = useState(null);

    const loadCategories = useCallback(async (refresh = false) => {
        if (refresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setPageError("");

        try {
            const response = await api.get("/category");

            if (response.data?.success === false) {
                throw new Error(
                    response.data?.message ||
                    "Unable to fetch categories."
                );
            }

            const data = response.data?.data;

            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Load categories error:", error);

            setPageError(
                errorMessage(
                    error,
                    "Could not load categories. Check your API and try again."
                )
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const term = search.trim().toLowerCase();

            const matchesSearch =
                !term ||
                [
                    category.name,
                    category.description,
                    String(category.id),
                ].some((value) =>
                    String(value || "").toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === "all" ||
                String(category.status || "ACTIVE").toUpperCase() ===
                statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [categories, search, statusFilter]);

    const activeCount = categories.filter(
        (category) =>
            String(category.status || "ACTIVE").toUpperCase() === "ACTIVE"
    ).length;

    const inactiveCount = categories.length - activeCount;

    const saveCategory = async (payload) => {
        setSaving(true);
        setNotice("");
        setPageError("");

        try {
            if (modal.mode === "create") {
                const response = await api.post("/category", payload);

                if (response.data?.success === false) {
                    throw new Error(
                        response.data.message ||
                        "Could not create category."
                    );
                }

                setNotice("Category created successfully.");
            } else {
                const response = await api.put(
                    `/category/${modal.category.id}`,
                    payload
                );

                if (response.data?.success === false) {
                    throw new Error(
                        response.data.message ||
                        "Could not update category."
                    );
                }

                setNotice("Category updated successfully.");
            }

            setModal(null);
            await loadCategories(true);
        } finally {
            setSaving(false);
        }
    };

    const deactivateCategory = async (category) => {
        const confirmed = window.confirm(
            `Are you sure you want to deactivate "${category.name}"?`
        );

        if (!confirmed) return;

        setNotice("");
        setPageError("");

        try {
            const response = await api.delete(
                `/category/${category.id}`
            );

            if (response.data?.success === false) {
                throw new Error(
                    response.data.message ||
                    "Could not deactivate category."
                );
            }

            setNotice(`"${category.name}" was deactivated.`);
            await loadCategories(true);
        } catch (error) {
            setPageError(
                errorMessage(error, "Could not deactivate category.")
            );
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
    };

    return (
        <div className="min-h-full bg-slate-50/70 px-1 py-2 sm:px-1 sm:py-3">
            <div className="mx-auto max-w-7xl space-y-5">

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                            <Icon name="layers" size={13} />
                            Catalog Management
                        </div>

                        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                            Category Management
                        </h1>

                        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                            Create, organize and manage your product categories.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => loadCategories(true)}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        >
                            <span className={refreshing ? "animate-spin" : ""}>
                                <Icon name="refresh" size={16} />
                            </span>
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setPageError("");
                                setModal({
                                    mode: "create",
                                    category: EMPTY_FORM,
                                });
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98]"
                        >
                            <Icon name="plus" size={16} />
                            Add Category
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                {notice && (
                    <div
                        role="status"
                        className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
                    >
                        <div className="flex items-center gap-2">
                            <Icon name="check" size={17} />
                            {notice}
                        </div>

                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss notification"
                            className="rounded-md p-1 hover:bg-emerald-100"
                        >
                            <Icon name="close" size={15} />
                        </button>
                    </div>
                )}

                {pageError && (
                    <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800"
                    >
                        <div className="flex items-center gap-2">
                            <Icon name="alert" size={17} />
                            {pageError}
                        </div>

                        <button
                            type="button"
                            onClick={() => setPageError("")}
                            aria-label="Dismiss error"
                            className="rounded-md p-1 hover:bg-rose-100"
                        >
                            <Icon name="close" size={15} />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <StatCard
                        label="Total Categories"
                        value={categories.length}
                        icon="layers"
                        color="bg-violet-50 text-violet-700"
                        description="All categories in your catalog"
                    />

                    <StatCard
                        label="Active Categories"
                        value={activeCount}
                        icon="check"
                        color="bg-emerald-50 text-emerald-700"
                        description="Available for product organization"
                    />

                    <StatCard
                        label="Inactive Categories"
                        value={inactiveCount}
                        icon="tag"
                        color="bg-slate-100 text-slate-600"
                        description="Currently inactive categories"
                    />
                </div>

                {/* Category Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Table Header */}
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:px-5">
                        <h2 className="text-sm font-bold text-slate-900">
                            All Categories
                        </h2>

                        <p className="text-[11px] text-slate-400">
                            Manage your product classification
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
                        <div className="relative flex-1">
                            <Icon
                                name="search"
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search category name, description or ID..."
                                className={`${inputClass} pl-10`}
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    <Icon name="close" size={15} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className={`${inputClass} sm:w-40`}
                            >
                                <option value="all">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>

                            {(search || statusFilter !== "all") && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="shrink-0 rounded-xl px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-3.5 font-semibold">
                                        Category
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Description
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-5 py-3.5 font-semibold">
                                        Created
                                    </th>

                                    <th className="px-5 py-3.5 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />

                                            <p className="text-xs text-slate-500">
                                                Loading categories...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                                <Icon name="tag" size={23} />
                                            </div>

                                            <p className="text-sm font-semibold text-slate-800">
                                                {categories.length
                                                    ? "No matching categories"
                                                    : "No categories yet"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {categories.length
                                                    ? "Try changing your search or filters."
                                                    : "Create your first category to get started."}
                                            </p>

                                            {categories.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setModal({
                                                            mode: "create",
                                                            category: EMPTY_FORM,
                                                        })
                                                    }
                                                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                                                >
                                                    <Icon name="plus" size={14} />
                                                    Create Category
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="transition hover:bg-violet-50/30"
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                                        <Icon name="tag" size={17} />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-900">
                                                            {category.name}
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-slate-400">
                                                            CAT-
                                                            {String(category.id).padStart(
                                                                4,
                                                                "0"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="max-w-xs px-5 py-3.5 text-xs text-slate-500">
                                                <p className="line-clamp-2">
                                                    {category.description || "No description"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <StatusBadge status={category.status} />
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-slate-500">
                                                {formatDate(category.createdAt)}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setModal({
                                                                mode: "edit",
                                                                category: {
                                                                    ...EMPTY_FORM,
                                                                    ...category,
                                                                    description:
                                                                        category.description || "",
                                                                },
                                                            })
                                                        }
                                                        title="Edit category"
                                                        aria-label={`Edit ${category.name}`}
                                                        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                                                    >
                                                        <Icon name="edit" size={15} />
                                                    </button>

                                                    {String(
                                                        category.status || "ACTIVE"
                                                    ).toUpperCase() !== "INACTIVE" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    deactivateCategory(category)
                                                                }
                                                                title="Deactivate category"
                                                                aria-label={`Deactivate ${category.name}`}
                                                                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                                            >
                                                                <Icon name="trash" size={15} />
                                                            </button>
                                                        )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[11px] text-slate-500">
                            Showing{" "}
                            <strong className="text-slate-700">
                                {filteredCategories.length}
                            </strong>{" "}
                            of{" "}
                            <strong className="text-slate-700">
                                {categories.length}
                            </strong>{" "}
                            categories
                        </p>

                        <p className="text-[10px] text-slate-400">
                            Category access is controlled by backend permissions.
                        </p>
                    </div>
                </section>
            </div>

            {/* Modal */}
            {modal && (
                <CategoryModal
                    key={`${modal.mode}-${modal.category?.id || "new"}`}
                    mode={modal.mode}
                    category={modal.category || EMPTY_FORM}
                    saving={saving}
                    onClose={() => !saving && setModal(null)}
                    onSave={saveCategory}
                />
            )}
        </div>
    );
}

export default function CategoryPage() {
    return (
        <AuthGuard allowedRoles={[1]}>
            <CategoryManagementContent />
        </AuthGuard>
    );
}
