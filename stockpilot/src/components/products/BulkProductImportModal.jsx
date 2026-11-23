"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";
import {
    downloadProductImportTemplate,
    parseCsv,
} from "@/Utils/csvHelper";
import {
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    FileText,
} from "lucide-react";

export default function BulkProductImportModal({
    isOpen,
    onClose,
    onSuccess,
}) {
    const [csvText, setCsvText] = useState("");
    const [parsedData, setParsedData] = useState([]);
    const [fileName, setFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError("");
        setSuccessMsg("");

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") {
                setCsvText(content);
                const items = parseCsv(content);
                setParsedData(items);
            }
        };
        reader.onerror = () => {
            setError("Failed to read file.");
        };
        reader.readAsText(file);
    };

    const handleTextChange = (e) => {
        const text = e.target.value;
        setCsvText(text);
        setError("");
        setSuccessMsg("");
        const items = parseCsv(text);
        setParsedData(items);
    };

    const handleImportSubmit = async () => {
        if (!parsedData || parsedData.length === 0) {
            setError("No valid product data found to import. Please check your CSV.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccessMsg("");

        try {
            const payload = parsedData.map((item) => ({
                name: item.name || "",
                sku: item.sku || "",
                categoryId: item.categoryid || item.categoryId,
                price: item.price,
                description: item.description || "",
                status: item.status || "ACTIVE",
            }));

            const res = await api.post("/product/bulk", { products: payload });

            if (res.data?.success) {
                setSuccessMsg(`Successfully imported ${res.data.data?.count || payload.length} products!`);
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                    onClose();
                }, 1200);
            } else {
                setError(res.data?.message || "Import failed.");
            }
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.join("\n") ||
                "Failed to import products.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setCsvText("");
        setParsedData([]);
        setFileName("");
        setError("");
        setSuccessMsg("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Bulk Import Products
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Upload a CSV file or paste formatted spreadsheet data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Step 1: Template Download */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                    Need the standard CSV structure?
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Includes required columns: name, sku, categoryId, price, description, status
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={downloadProductImportTemplate}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Sample CSV Template
                        </button>
                    </div>

                    {/* Step 2: Upload or Paste */}
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Upload File or Paste CSV
                        </label>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-file-input"
                            />
                            <label
                                htmlFor="csv-file-input"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
                            >
                                <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                {fileName ? fileName : "Choose .CSV File"}
                            </label>

                            {fileName && (
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="text-xs text-rose-500 hover:underline"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <textarea
                            rows={4}
                            value={csvText}
                            onChange={handleTextChange}
                            placeholder="name,sku,categoryId,price,description,status&#10;Industrial Bolt,BOLT-101,1,15.50,Steel Bolt,ACTIVE"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                        />
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 whitespace-pre-line">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Preview Table */}
                    {parsedData.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Detected Records ({parsedData.length})
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    Showing first 5 rows preview
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="p-2.5">Name</th>
                                            <th className="p-2.5">SKU</th>
                                            <th className="p-2.5">Category ID</th>
                                            <th className="p-2.5">Price</th>
                                            <th className="p-2.5">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {parsedData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                                                    {row.name || "—"}
                                                </td>
                                                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">
                                                    {row.sku || "—"}
                                                </td>
                                                <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                                    {row.categoryid || row.categoryId || "—"}
                                                </td>
                                                <td className="p-2.5 text-slate-800 dark:text-slate-200 font-semibold">
                                                    ₹{row.price || "0"}
                                                </td>
                                                <td className="p-2.5">
                                                    <span className="inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                        {row.status || "ACTIVE"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleImportSubmit}
                        disabled={loading || parsedData.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Importing Catalog...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                <span>Import {parsedData.length} Product(s)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
