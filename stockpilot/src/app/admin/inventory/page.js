"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import AdminLayout from "@/components/layout/AdminLayout";
import api from "@/lib/api";
import { AlertTriangle, Boxes, CheckCircle2, Edit3, Loader2, Package, PackageX, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

const ADMIN = 1;
const MANAGER = 4;
const STAFF = 5;
const emptyForm = { productId: "", warehouseId: "", quantity: "0", reorderLevel: "10" };

function rowsOf(response) {
  const body = response?.data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.rows)) return body.data.rows;
  if (Array.isArray(body?.rows)) return body.rows;
  return [];
}
function messageOf(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong.";
}
function getUser() {
  if (typeof window === "undefined") return null;
  for (const key of ["user", "currentUser", "authUser", "loggedInUser"]) {
    try {
      const value = window.localStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value);
      const user = parsed?.user || parsed;
      if (user?.id || user?.roleId) return user;
    } catch {}
  }
  return null;
}
function stockStatus(item) {
  const quantity = Number(item?.quantity || 0);
  const reorder = Number(item?.reorderLevel || 0);
  if (quantity <= 0) return "Out of stock";
  if (quantity <= reorder) return "Low stock";
  return "In stock";
}
function number(value) { return new Intl.NumberFormat("en-IN").format(Number(value) || 0); }
function Badge({ item }) {
  const status = stockStatus(item);
  const style = status === "Out of stock" ? "bg-red-50 text-red-700 ring-red-200" : status === "Low stock" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>{status}</span>;
}
function Stat({ title, value, hint, Icon, tone }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs text-slate-500">{hint}</p></div>;
}

function InventoryContent() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("product");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const pageSize = 10;
  const roleId = Number(user?.roleId ?? user?.role?.id);
  const canManage = roleId === ADMIN || roleId === MANAGER;

  useEffect(() => { setUser(getUser()); }, []);

  const loadData = useCallback(async (refresh = false) => {
    setError("");
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const results = await Promise.allSettled([api.get("/inventory"), api.get("/product"), api.get("/warehouse")]);
      if (results[0].status !== "fulfilled") throw results[0].reason;
      setInventory(rowsOf(results[0].value));
      setProducts(results[1].status === "fulfilled" ? rowsOf(results[1].value) : []);
      setWarehouses(results[2].status === "fulfilled" ? rowsOf(results[2].value) : []);
    } catch (err) { setError(messageOf(err)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const productName = useCallback((item) => item?.product?.name || products.find(p => Number(p.id) === Number(item?.productId))?.name || `Product #${item?.productId ?? "—"}`, [products]);
  const productSku = useCallback((item) => item?.product?.sku || products.find(p => Number(p.id) === Number(item?.productId))?.sku || "—", [products]);
  const warehouseName = useCallback((item) => item?.warehouse?.name || item?.warehouse?.warehouseName || warehouses.find(w => Number(w.id) === Number(item?.warehouseId))?.name || warehouses.find(w => Number(w.id) === Number(item?.warehouseId))?.warehouseName || `Warehouse #${item?.warehouseId ?? "—"}`, [warehouses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = inventory.filter(item => {
      const matchesText = !q || productName(item).toLowerCase().includes(q) || productSku(item).toLowerCase().includes(q) || warehouseName(item).toLowerCase().includes(q);
      const matchesWarehouse = warehouseFilter === "all" || Number(item.warehouseId) === Number(warehouseFilter);
      const status = stockStatus(item);
      const matchesStatus = statusFilter === "all" || (statusFilter === "low" && status === "Low stock") || (statusFilter === "out" && status === "Out of stock") || (statusFilter === "in" && status === "In stock");
      return matchesText && matchesWarehouse && matchesStatus;
    });
    return result.sort((a, b) => sort === "qty-asc" ? Number(a.quantity) - Number(b.quantity) : sort === "qty-desc" ? Number(b.quantity) - Number(a.quantity) : sort === "warehouse" ? warehouseName(a).localeCompare(warehouseName(b)) : productName(a).localeCompare(productName(b)));
  }, [inventory, search, warehouseFilter, statusFilter, sort, productName, productSku, warehouseName]);

  useEffect(() => { setPage(1); }, [search, warehouseFilter, statusFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalUnits = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const lowCount = inventory.filter(item => stockStatus(item) === "Low stock").length;
  const outCount = inventory.filter(item => stockStatus(item) === "Out of stock").length;

  function openCreate() { setSelected(null); setForm(emptyForm); setError(""); setNotice(""); setModal("create"); }
  function openEdit(item) { setSelected(item); setForm({ ...emptyForm, reorderLevel: String(item.reorderLevel ?? 10) }); setError(""); setNotice(""); setModal("edit"); }
  function closeModal() { if (!saving) { setModal(""); setSelected(null); } }
  function changeForm(event) { setForm(prev => ({ ...prev, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault(); setError(""); setNotice("");
    const reorderLevel = Number(form.reorderLevel);
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) { setError("Reorder level must be a non-negative whole number."); return; }
    if (modal === "create") {
      const productId = Number(form.productId), warehouseId = Number(form.warehouseId), quantity = Number(form.quantity);
      if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(warehouseId) || warehouseId < 1) { setError("Please select a product and warehouse."); return; }
      if (!Number.isInteger(quantity) || quantity < 0) { setError("Quantity must be a non-negative whole number."); return; }
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await api.post("/inventory", { productId: Number(form.productId), warehouseId: Number(form.warehouseId), quantity: Number(form.quantity), reorderLevel });
        setNotice("Inventory created successfully.");
      } else if (modal === "edit" && selected) {
        await api.patch(`/inventory/${selected.id}`, { reorderLevel });
        setNotice("Reorder level updated successfully.");
      }
      setModal(""); setSelected(null); await loadData(true);
    } catch (err) { setError(messageOf(err)); }
    finally { setSaving(false); }
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete inventory for "${productName(item)}" in "${warehouseName(item)}"?`)) return;
    setError(""); setNotice("");
    try { await api.delete(`/inventory/${item.id}`); setNotice("Inventory record deleted."); await loadData(true); }
    catch (err) { setError(messageOf(err)); }
  }

  async function showLowStock() {
    if (warehouseFilter === "all") { setStatusFilter("low"); setNotice("Showing low-stock items in accessible inventory."); return; }
    setError("");
    try {
      const response = await api.get(`/inventory/low-stock/${warehouseFilter}`);
      const lowRows = rowsOf(response);
      setInventory(prev => [...prev.filter(item => Number(item.warehouseId) !== Number(warehouseFilter)), ...lowRows]);
      setStatusFilter("low"); setNotice("Loaded low-stock items for the selected warehouse.");
    } catch (err) { setError(messageOf(err)); }
  }

  return <AdminLayout><main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-indigo-600">StockPilot / Inventory</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Inventory Management</h1><p className="mt-2 text-sm text-slate-500">Monitor stock levels and reorder thresholds across accessible warehouses.</p></div><div className="flex gap-2"><button type="button" onClick={() => loadData(true)} disabled={loading || refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Refresh</button>{canManage && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" />Add Inventory</button>}</div></header>
    {error && !modal && <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertTriangle className="h-5 w-5 shrink-0" /><span className="flex-1">{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X className="h-4 w-4" /></button></div>}
    {notice && !modal && <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" /><span className="flex-1">{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X className="h-4 w-4" /></button></div>}
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat title="Inventory Records" value={number(inventory.length)} hint="Product and warehouse combinations" Icon={Package} tone="bg-indigo-50 text-indigo-700"/><Stat title="Total Units" value={number(totalUnits)} hint="Combined stock quantity" Icon={Boxes} tone="bg-blue-50 text-blue-700"/><Stat title="Low Stock" value={number(lowCount)} hint="At or below reorder level" Icon={AlertTriangle} tone="bg-amber-50 text-amber-700"/><Stat title="Out of Stock" value={number(outCount)} hint="Quantity is zero" Icon={PackageX} tone="bg-red-50 text-red-700"/></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="relative"><span className="sr-only">Search inventory</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, SKU, warehouse..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/></label><select aria-label="Warehouse filter" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="all">All accessible warehouses</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name || w.warehouseName || `Warehouse #${w.id}`}</option>)}</select><select aria-label="Stock status filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="all">All stock statuses</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select><select aria-label="Sort inventory" value={sort} onChange={e => setSort(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"><option value="product">Sort: Product name</option><option value="warehouse">Sort: Warehouse</option><option value="qty-asc">Quantity: Low to high</option><option value="qty-desc">Quantity: High to low</option></select></div><div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Showing <b className="text-slate-800">{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)}</b> of <b className="text-slate-800">{filtered.length}</b> records</p><button type="button" onClick={showLowStock} className="inline-flex items-center gap-2 self-start rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"><AlertTriangle className="h-4 w-4"/>Show low stock</button></div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Product</th><th className="px-5 py-4">Warehouse</th><th className="px-5 py-4 text-right">Quantity</th><th className="px-5 py-4 text-right">Reorder level</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/>Loading inventory...</span></td></tr> : visible.length === 0 ? <tr><td colSpan={6} className="px-5 py-16 text-center"><Package className="mx-auto h-9 w-9 text-slate-300"/><p className="mt-3 font-semibold text-slate-800">No inventory found</p><p className="mt-1 text-sm text-slate-500">Change filters or add an inventory record.</p>{canManage && <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4"/>Add Inventory</button>}</td></tr> : visible.map(item => <tr key={item.id} className="hover:bg-slate-50/80"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{productName(item)}</div><div className="mt-1 text-xs text-slate-500">SKU: {productSku(item)} · ID: {item.id}</div></td><td className="px-5 py-4 text-slate-700">{warehouseName(item)}</td><td className={`px-5 py-4 text-right font-semibold tabular-nums ${Number(item.quantity) <= 0 ? "text-red-700" : Number(item.quantity) <= Number(item.reorderLevel) ? "text-amber-700" : "text-slate-900"}`}>{number(item.quantity)}<div className="mt-1 text-xs font-normal text-slate-400">Read-only</div></td><td className="px-5 py-4 text-right font-medium tabular-nums">{number(item.reorderLevel)}</td><td className="px-5 py-4"><Badge item={item}/></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{canManage && <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-700"><Edit3 className="h-3.5 w-3.5"/>Edit</button>}{canManage && <button type="button" onClick={() => removeItem(item)} aria-label={`Delete inventory ${item.id}`} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4"/></button>}</div></td></tr>)}</tbody></table></div>{!loading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><button disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div></div>}</section>
    <aside className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><Boxes className="h-5 w-5 shrink-0"/><div><p className="font-semibold">Stock quantity is read-only on this page</p><p className="mt-1 text-blue-800">Use Stock Movement for stock-in, stock-out and adjustment so all quantity changes can be tracked.</p></div></aside>
  </div></main>
  {modal && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title" className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><h2 id="inventory-modal-title" className="text-lg font-bold text-slate-900">{modal === "create" ? "Add Inventory" : "Edit Reorder Level"}</h2><p className="mt-1 text-sm text-slate-500">{modal === "create" ? "Create a product stock record for a warehouse." : `Update reorder threshold for ${productName(selected)}.`}</p></div><button type="button" onClick={closeModal} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><form onSubmit={submit} className="space-y-5 px-6 py-5">{error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}{modal === "create" ? <><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Product *</span><select name="productId" value={form.productId} onChange={changeForm} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select product</option>{products.filter(p => String(p.status || "ACTIVE").toUpperCase() === "ACTIVE").map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Warehouse *</span><select name="warehouseId" value={form.warehouseId} onChange={changeForm} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select warehouse</option>{warehouses.filter(w => String(w.status || "ACTIVE").toUpperCase() === "ACTIVE").map(w => <option key={w.id} value={w.id}>{w.name || w.warehouseName || `Warehouse #${w.id}`}</option>)}</select></label></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Opening quantity *</span><input name="quantity" type="number" min="0" step="1" value={form.quantity} onChange={changeForm} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><span className="mt-1 block text-xs text-slate-500">Initial stock for this product and warehouse.</span></label><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Reorder level *</span><input name="reorderLevel" type="number" min="0" step="1" value={form.reorderLevel} onChange={changeForm} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/></label></div></> : <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-4"><div className="font-semibold text-slate-900">{productName(selected)}</div><div className="mt-1 text-sm text-slate-500">{productSku(selected)} · {warehouseName(selected)}</div><div className="mt-3 text-sm">Current quantity: <b>{number(selected?.quantity)}</b> <span className="text-slate-400">(read-only)</span></div></div><label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">Reorder level *</span><input name="reorderLevel" type="number" min="0" step="1" value={form.reorderLevel} onChange={changeForm} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><span className="mt-1 block text-xs text-slate-500">Low stock means quantity is at or below this value.</span></label></div>}<div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeModal} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin"/>}{modal === "create" ? "Create inventory" : "Save changes"}</button></div></form></div></div>}
  </AdminLayout>;
}

export default function InventoryPage() {
  return <AuthGuard allowedRoles={[ADMIN, MANAGER, STAFF]}><InventoryContent /></AuthGuard>;
}
