"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Boxes,
    CalendarDays,
    ChevronDown,
    Clock3,
    FileText,
    History,
    Loader2,
    Package,
    RefreshCw,
    Search,
    X,
} from "lucide-react";

const ROLE_ADMIN = 1;
const ROLE_INVENTORY_MANAGER = 4;
const ROLE_WAREHOUSE_STAFF = 5;
const PAGE_SIZE = 10;

function toArray(response) {
    const body = response?.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.rows)) return body.rows;
    if (Array.isArray(body?.data?.rows)) return body.data.rows;
    return [];
}

function errorMessage(error, fallback = "Something went wrong.") {
    return error?.response?.data?.message || error?.message || fallback;
}

function numberFormat(value) {
    return new Intl.NumberFormat("en-IN").format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getUserFromStorage() {
    if (typeof window === "undefined") return null;
    for (const key of ["user", "currentUser", "authUser", "loggedInUser"]) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const candidate = parsed?.user || parsed;
            if (candidate && (candidate.id || candidate.roleId || candidate.role?.id)) return candidate;
        } catch {
            // Continue checking other common keys.
        }
    }
    return null;
}

function inventoryProduct(item, products) {
    return item?.product || products.find((product) => Number(product.id) === Number(item.productId)) || {};
}

function productLabel(item, products) {
    const product = inventoryProduct(item, products);
    return product.name || `Product #${item?.productId ?? "—"}`;
}

function productSku(item, products) {
    return inventoryProduct(item, products).sku || "—";
}

function warehouseLabel(item, warehouses) {
    const embedded = item?.warehouse?.name || item?.warehouse?.warehouseName;
    if (embedded) return embedded;
    const found = warehouses.find((warehouse) => Number(warehouse.id) === Number(item?.warehouseId));
    return found?.name || found?.warehouseName || `Warehouse #${item?.warehouseId ?? "—"}`;
}

function TypeBadge({ type }) {
    const isIn = String(type).toUpperCase() === "IN";
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isIn ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-orange-50 text-orange-700 ring-orange-200"}`}>
            {isIn ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
            Stock {isIn ? "In" : "Out"}
        </span>
    );
}

function MetricCard({ title, value, detail, icon: Icon, iconStyle }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${iconStyle}`}><Icon className="h-5 w-5" /></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{detail}</p>
        </div>
    );
}

function StockMovementContent() {
    const [user, setUser] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [movements, setMovements] = useState([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState("");
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ inventoryId: "", type: "IN", quantity: "1", note: "" });

    useEffect(() => setUser(getUserFromStorage()), []);

    const roleId = Number(user?.roleId ?? user?.role?.id);
    const canCreate = roleId === ROLE_ADMIN || roleId === ROLE_INVENTORY_MANAGER;

    const loadBaseData = useCallback(async (refresh = false) => {
        setError("");
        if (!refresh) setLoading(true);
        try {
            const [inventoryResponse, productResponse, warehouseResponse] = await Promise.allSettled([
                api.get("/inventory"),
                api.get("/product"),
                api.get("/warehouse"),
            ]);
            if (inventoryResponse.status !== "fulfilled") throw inventoryResponse.reason;
            const rows = toArray(inventoryResponse.value);
            setInventory(rows);
            setProducts(productResponse.status === "fulfilled" ? toArray(productResponse.value) : []);
            setWarehouses(warehouseResponse.status === "fulfilled" ? toArray(warehouseResponse.value) : []);
            setSelectedInventoryId((previous) => {
                if (previous && rows.some((row) => String(row.id) === String(previous))) return previous;
                return rows.length ? String(rows[0].id) : "";
            });
            setForm((previous) => ({ ...previous, inventoryId: previous.inventoryId || (rows[0] ? String(rows[0].id) : "") }));
        } catch (err) {
            setError(errorMessage(err, "Unable to load inventory. Please try again."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadBaseData(); }, [loadBaseData]);

    const selectedInventory = useMemo(
        () => inventory.find((item) => String(item.id) === String(selectedInventoryId)) || null,
        [inventory, selectedInventoryId]
    );

    const loadMovements = useCallback(async (inventoryId) => {
        if (!inventoryId) {
            setMovements([]);
            return;
        }
        setHistoryLoading(true);
        setError("");
        try {
            const response = await api.get(`/stockMovement/inventory/${inventoryId}`);
            setMovements(toArray(response));
        } catch (err) {
            setMovements([]);
            setError(errorMessage(err, "Unable to load stock movement history."));
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedInventoryId) loadMovements(selectedInventoryId);
        else setMovements([]);
    }, [selectedInventoryId, loadMovements]);

    const filteredMovements = useMemo(() => {
        const query = search.trim().toLowerCase();
        const now = new Date();
        return movements.filter((movement) => {
            const movementType = String(movement.type || "").toUpperCase();
            const matchesType = typeFilter === "all" || movementType === typeFilter;
            const createdAt = movement.createdAt ? new Date(movement.createdAt) : null;
            let matchesDate = true;
            if (dateFilter !== "all" && createdAt && !Number.isNaN(createdAt.getTime())) {
                const days = dateFilter === "7" ? 7 : 30;
                const cutoff = new Date(now);
                cutoff.setDate(cutoff.getDate() - days);
                matchesDate = createdAt >= cutoff;
            }
            const userName = movement.user?.name || movement.user?.email || "";
            const matchesSearch = !query ||
                String(movement.note || "").toLowerCase().includes(query) ||
                userName.toLowerCase().includes(query) ||
                String(movement.id).includes(query);
            return matchesType && matchesDate && matchesSearch;
        });
    }, [movements, search, typeFilter, dateFilter]);

    useEffect(() => setPage(1), [search, typeFilter, dateFilter, selectedInventoryId]);
    const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageMovements = filteredMovements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const totalIn = movements.filter((item) => String(item.type).toUpperCase() === "IN").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalOut = movements.filter((item) => String(item.type).toUpperCase() === "OUT").reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const stockQty = Number(selectedInventory?.quantity || 0);

    const openCreateForm = () => {
        setError("");
        setNotice("");
        setForm({ inventoryId: selectedInventoryId || (inventory[0] ? String(inventory[0].id) : ""), type: "IN", quantity: "1", note: "" });
        setShowForm(true);
    };

    const submitMovement = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        const quantity = Number(form.quantity);
        const inventoryId = Number(form.inventoryId);
        if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
            setError("Please select an inventory record.");
            return;
        }
        if (!Number.isInteger(quantity) || quantity <= 0) {
            setError("Quantity must be a positive whole number.");
            return;
        }
        if (form.note.length > 255) {
            setError("Note must be 255 characters or fewer.");
            return;
        }
        const targetInventory = inventory.find((item) => Number(item.id) === inventoryId);
        if (form.type === "OUT" && targetInventory && quantity > Number(targetInventory.quantity || 0)) {
            setError(`Insufficient stock. Available quantity is ${numberFormat(targetInventory.quantity)}.`);
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/stockMovement", {
                inventoryId,
                type: form.type,
                quantity,
                note: form.note.trim() || null,
            });
            setShowForm(false);
            setNotice(`Stock ${form.type === "IN" ? "in" : "out"} recorded successfully.`);
            setSelectedInventoryId(String(inventoryId));
            await loadBaseData(true);
            await loadMovements(inventoryId);
        } catch (err) {
            setError(errorMessage(err, "Unable to record stock movement."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout>
            <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-6">
                    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-sm font-medium text-indigo-600">StockPilot / Stock Movement</p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Stock Movement</h1>
                            <p className="mt-2 text-sm text-slate-500">Record stock received or issued and review movement history.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => loadBaseData(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
                            </button>
                            {canCreate && <button type="button" onClick={openCreateForm} disabled={!inventory.length} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"><Boxes className="h-4 w-4" /> Record Movement</button>}
                        </div>
                    </header>

                    {error && !showForm && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><X className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1">{error}</div><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
                    {notice && !showForm && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}

                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard title="Inventory Records" value={numberFormat(inventory.length)} detail="Accessible product/warehouse records" icon={Package} iconStyle="bg-indigo-50 text-indigo-700" />
                        <MetricCard title="Current Stock" value={numberFormat(stockQty)} detail={selectedInventory ? `For ${productLabel(selectedInventory, products)}` : "Select an inventory record"} icon={Boxes} iconStyle="bg-blue-50 text-blue-700" />
                        <MetricCard title="Recorded Stock In" value={numberFormat(totalIn)} detail="For the selected inventory record" icon={ArrowDownToLine} iconStyle="bg-emerald-50 text-emerald-700" />
                        <MetricCard title="Recorded Stock Out" value={numberFormat(totalOut)} detail="For the selected inventory record" icon={ArrowUpFromLine} iconStyle="bg-orange-50 text-orange-700" />
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <label className="block w-full lg:max-w-2xl">
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Select inventory record</span>
                                <span className="relative block">
                                    <select value={selectedInventoryId} onChange={(event) => setSelectedInventoryId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                                        <option value="">Select product / warehouse</option>
                                        {inventory.map((item) => (
                                            <option key={item.id} value={item.id}>{productLabel(item, products)} · {productSku(item, products)} · {warehouseLabel(item, warehouses)} · Stock: {numberFormat(item.quantity)}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </span>
                            </label>
                            {selectedInventory && <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                                <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Current stock</p><p className="mt-1 text-lg font-bold text-slate-900">{numberFormat(selectedInventory.quantity)}</p></div>
                                <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Reorder level</p><p className="mt-1 text-lg font-bold text-slate-900">{numberFormat(selectedInventory.reorderLevel)}</p></div>
                            </div>}
                        </div>
                        {selectedInventory && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4" /> {productLabel(selectedInventory, products)}</span>
                            <span>SKU: {productSku(selectedInventory, products)}</span>
                            <span>Warehouse: {warehouseLabel(selectedInventory, warehouses)}</span>
                        </div>}
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-5 sm:px-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><History className="h-5 w-5 text-indigo-600" /> Movement History</h2><p className="mt-1 text-sm text-slate-500">{selectedInventory ? `History for ${productLabel(selectedInventory, products)}` : "Select an inventory record to view its history."}</p></div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <label className="relative"><span className="sr-only">Search movement history</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search note, user, ID" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
                                    <label className="relative"><span className="sr-only">Filter movement type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="all">All types</option><option value="IN">Stock In</option><option value="OUT">Stock Out</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></label>
                                    <label className="relative"><span className="sr-only">Filter by date</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="all">Any time</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></label>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[850px] w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 font-semibold">Movement</th><th className="px-5 py-4 text-right font-semibold">Quantity</th><th className="px-5 py-4 font-semibold">Note</th><th className="px-5 py-4 font-semibold">Performed by</th><th className="px-5 py-4 font-semibold">Date & time</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading || historyLoading ? <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading movement history...</span></td></tr> : !selectedInventoryId ? <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500">Select an inventory record to view movements.</td></tr> : pageMovements.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center"><History className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No movements found</p><p className="mt-1 text-sm text-slate-500">There are no matching stock movements for this inventory record.</p>{canCreate && <button type="button" onClick={openCreateForm} className="mt-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Record first movement</button>}</td></tr> : pageMovements.map((movement) => <tr key={movement.id} className="hover:bg-slate-50/80"><td className="px-5 py-4"><TypeBadge type={movement.type} /><div className="mt-1.5 text-xs text-slate-400">Movement #{movement.id}</div></td><td className={`px-5 py-4 text-right font-bold tabular-nums ${String(movement.type).toUpperCase() === "IN" ? "text-emerald-700" : "text-orange-700"}`}>{String(movement.type).toUpperCase() === "IN" ? "+" : "−"}{numberFormat(movement.quantity)}</td><td className="max-w-xs px-5 py-4 text-slate-600"><span className="line-clamp-2">{movement.note || "—"}</span></td><td className="px-5 py-4"><div className="font-medium text-slate-800">{movement.user?.name || "Unknown user"}</div><div className="mt-1 text-xs text-slate-500">{movement.user?.email || "—"}</div></td><td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDate(movement.createdAt)}</span></td></tr>)}
                                </tbody>
                            </table>
                        </div>
                        {!loading && !historyLoading && filteredMovements.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMovements.length)} of {filteredMovements.length} movements</p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Previous</button><button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Next</button></div></div>}
                    </section>

                    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><Clock3 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Every movement is recorded</p><p className="mt-1 text-blue-800">Stock changes are processed by the backend transaction. Stock Out is rejected if the requested quantity exceeds available stock.</p></div></div>
                </div>
            </main>

            {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="movement-form-title" className="my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="movement-form-title" className="text-lg font-bold text-slate-900">Record Stock Movement</h2><p className="mt-1 text-sm text-slate-500">Record incoming or outgoing stock for an inventory item.</p></div><button type="button" onClick={() => !submitting && setShowForm(false)} disabled={submitting} aria-label="Close form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button></div>
                <form onSubmit={submitMovement} className="space-y-5 px-6 py-5">
                    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Inventory record <span className="text-red-500">*</span></span><select required value={form.inventoryId} onChange={(event) => setForm((previous) => ({ ...previous, inventoryId: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="">Select inventory</option>{inventory.map((item) => <option key={item.id} value={item.id}>{productLabel(item, products)} · {warehouseLabel(item, warehouses)} · Available: {numberFormat(item.quantity)}</option>)}</select></label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Movement type <span className="text-red-500">*</span></span><select value={form.type} onChange={(event) => setForm((previous) => ({ ...previous, type: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="IN">Stock In (+)</option><option value="OUT">Stock Out (−)</option></select></label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Quantity <span className="text-red-500">*</span></span><input type="number" min="1" step="1" required value={form.quantity} onChange={(event) => setForm((previous) => ({ ...previous, quantity: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label></div>
                    {form.type === "OUT" && form.inventoryId && <p className="-mt-2 text-xs text-slate-500">Available stock: {numberFormat(inventory.find((item) => Number(item.id) === Number(form.inventoryId))?.quantity)} units. Backend will validate stock availability.</p>}
                    <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={3} maxLength={255} value={form.note} onChange={(event) => setForm((previous) => ({ ...previous, note: event.target.value }))} placeholder="e.g. Supplier delivery, order dispatch, damaged goods..." className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><p className="mt-1 text-right text-xs text-slate-400">{form.note.length}/255</p></label>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => !submitting && setShowForm(false)} disabled={submitting} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={submitting || !inventory.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}{form.type === "IN" ? "Record Stock In" : "Record Stock Out"}</button></div>
                </form>
            </div></div>}
        </AdminLayout>
    );
}

export default function StockMovementPage() {
    return <AuthGuard allowedRoles={[ROLE_ADMIN, ROLE_INVENTORY_MANAGER, ROLE_WAREHOUSE_STAFF]}><StockMovementContent /></AuthGuard>;
}
