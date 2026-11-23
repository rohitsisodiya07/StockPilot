"use client";

import { useRef } from "react";
import {
    Printer,
    X,
    FileText,
    Boxes,
    Building2,
    CheckSquare,
    Truck,
    Download,
} from "lucide-react";

const currency = (val) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(val) || 0);

const formatDate = (val) => {
    if (!val) return new Date().toLocaleDateString("en-IN");
    const d = new Date(val);
    return isNaN(d.getTime())
        ? new Date().toLocaleDateString("en-IN")
        : d.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          });
};

export default function PrintableDocumentModal({
    isOpen,
    onClose,
    type = "INVOICE", // "INVOICE" | "PACKING_SLIP" | "GRN"
    order = null,
}) {
    if (!isOpen || !order) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadHTML = () => {
        const docElem = document.getElementById("printable-document-content");
        if (!docElem) return;

        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${title} - ${documentNumber}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #475569; }
        .text-right { text-align: right; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    ${docElem.innerHTML}
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${documentNumber}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const isInvoice = type === "INVOICE";
    const isPackingSlip = type === "PACKING_SLIP";
    const isGRN = type === "GRN";

    const title = isInvoice
        ? "TAX INVOICE"
        : isPackingSlip
        ? "WAREHOUSE PACKING SLIP & PICK LIST"
        : "GOODS RECEIVED NOTE (GRN)";

    const documentNumber = isInvoice
        ? `INV-SO-${String(order.id).padStart(5, "0")}`
        : isPackingSlip
        ? `PACK-SO-${String(order.id).padStart(5, "0")}`
        : `GRN-PO-${String(order.id).padStart(5, "0")}`;

    const items = order.items || [];
    const subtotal = items.reduce((acc, it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice || it.price || it.product?.price || 0);
        return acc + qty * price;
    }, 0);

    const taxAmount = isInvoice ? subtotal * 0.18 : 0;
    const grandTotal = subtotal + taxAmount;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
            {/* Print Styles for standard paper */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-document-content,
                    #printable-document-content * {
                        visibility: visible !important;
                    }
                    #printable-document-content {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 24px !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
                {/* Modal Top Action Bar */}
                <div className="no-print flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                            Printable Preview • {title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadHTML}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Document</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition cursor-pointer"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Print / Save as PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Document Paper Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/50">
                    <div
                        id="printable-document-content"
                        className="mx-auto max-w-3xl rounded-xl bg-white text-slate-900 p-8 sm:p-12 shadow-md border border-slate-200 text-xs leading-relaxed"
                    >
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm">
                                        SP
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-black tracking-tight text-slate-900">
                                            STOCKPILOT ERP
                                        </h1>
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            Logistics, Warehousing & Supply Chain Management
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 text-[11px] text-slate-500 space-y-0.5">
                                    <p>Plot 42, Logistics Industrial Park, Sector 18</p>
                                    <p>GSTIN: 27AABCS1429B1Z4 • support@stockpilot.com</p>
                                </div>
                            </div>

                            <div className="sm:text-right">
                                <span className="inline-block rounded-md bg-slate-900 text-white font-bold text-xs uppercase px-3 py-1 tracking-wider">
                                    {title}
                                </span>
                                <div className="mt-3 text-[11px] space-y-1">
                                    <p>
                                        <span className="font-bold text-slate-700">Doc No:</span>{" "}
                                        <span className="font-mono font-bold text-slate-900">
                                            {documentNumber}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-700">Date:</span>{" "}
                                        {formatDate(order.createdAt || order.orderDate)}
                                    </p>
                                    <p>
                                        <span className="font-bold text-slate-700">Status:</span>{" "}
                                        <span className="font-bold uppercase text-blue-700">
                                            {order.status || "CONFIRMED"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parties / Address Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    {isGRN ? "SUPPLIER INFORMATION" : "CUSTOMER / BILLED TO"}
                                </h4>
                                <p className="font-bold text-slate-900 text-sm">
                                    {order.customerName ||
                                        order.supplier?.name ||
                                        order.supplierName ||
                                        "Walk-in Client"}
                                </p>
                                <p className="text-slate-600 mt-1">
                                    {order.customerEmail ||
                                        order.supplier?.email ||
                                        order.supplierEmail ||
                                        "contact@client.com"}
                                </p>
                                {(order.customerPhone || order.supplier?.phone) && (
                                    <p className="text-slate-600">
                                        Phone: {order.customerPhone || order.supplier?.phone}
                                    </p>
                                )}
                            </div>

                            <div className="sm:text-right">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    FULFILLMENT / WAREHOUSE
                                </h4>
                                <p className="font-bold text-slate-900 text-sm">
                                    {order.warehouse?.name || order.warehouseName || "Central Warehouse Hub"}
                                </p>
                                <p className="text-slate-600 mt-1">
                                    {order.warehouse?.location || "Sector 18 Distribution Yard"}
                                </p>
                                {isPackingSlip && (
                                    <p className="text-slate-500 text-[11px] mt-1 font-medium">
                                        Handling: Standard Fragile Goods Handling
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="py-6">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                        <th className="py-2.5 pr-2 w-10">#</th>
                                        {isPackingSlip && <th className="py-2.5 px-2 w-12 text-center">Verify</th>}
                                        <th className="py-2.5 px-2">Item Description</th>
                                        <th className="py-2.5 px-2">SKU</th>
                                        <th className="py-2.5 px-2 text-center">Qty</th>
                                        {!isPackingSlip && (
                                            <>
                                                <th className="py-2.5 px-2 text-right">Unit Price</th>
                                                <th className="py-2.5 pl-2 text-right">Total</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={isPackingSlip ? 5 : 6}
                                                className="py-6 text-center text-slate-400"
                                            >
                                                No items registered for this order
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => {
                                            const prodName =
                                                item.product?.name || item.productName || "Product Item";
                                            const sku =
                                                item.product?.sku || item.sku || `SKU-${item.productId || idx + 1}`;
                                            const qty = Number(item.quantity) || 1;
                                            const price = Number(
                                                item.unitPrice || item.price || item.product?.price || 0
                                            );
                                            const rowTotal = qty * price;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="py-3 pr-2 text-slate-400 font-medium">
                                                        {idx + 1}
                                                    </td>
                                                    {isPackingSlip && (
                                                        <td className="py-3 px-2 text-center">
                                                            <span className="inline-block h-4 w-4 rounded-xs border-2 border-slate-400" />
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-2">
                                                        <span className="font-bold text-slate-900">
                                                            {prodName}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 font-mono text-[11px] text-slate-600">
                                                        {sku}
                                                    </td>
                                                    <td className="py-3 px-2 text-center font-bold text-slate-800">
                                                        {qty}
                                                    </td>
                                                    {!isPackingSlip && (
                                                        <>
                                                            <td className="py-3 px-2 text-right text-slate-600">
                                                                {currency(price)}
                                                            </td>
                                                            <td className="py-3 pl-2 text-right font-bold text-slate-900">
                                                                {currency(rowTotal)}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Totals */}
                        {!isPackingSlip && (
                            <div className="flex justify-end pt-4 border-t border-slate-200">
                                <div className="w-64 space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-slate-900">
                                            {currency(subtotal)}
                                        </span>
                                    </div>
                                    {isInvoice && (
                                        <div className="flex justify-between text-slate-600">
                                            <span>Integrated GST (18%)</span>
                                            <span className="font-semibold text-slate-900">
                                                {currency(taxAmount)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-extrabold text-slate-900">
                                        <span>Total Amount</span>
                                        <span>{currency(grandTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Signatures & Declarations */}
                        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                            <div>
                                <h5 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                                    Terms & Conditions
                                </h5>
                                <p>
                                    1. Goods once inspected and received cannot be returned without prior written authorization.
                                </p>
                                <p>
                                    2. Disputes subject to local jurisdiction only.
                                </p>
                            </div>

                            <div className="text-right flex flex-col justify-end">
                                <div className="border-b border-slate-400 w-48 ml-auto pb-1 mb-1" />
                                <span className="font-bold text-slate-800">
                                    {isInvoice
                                        ? "Authorized Signatory"
                                        : isPackingSlip
                                        ? "Dispatched & Verified By"
                                        : "Quality Inspected By"}
                                </span>
                                <span className="text-[10px] text-slate-400">StockPilot Logistics Division</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
