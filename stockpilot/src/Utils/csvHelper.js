/**
 * StockPilot CSV Export & Import Utility
 */

/**
 * Escapes a cell value for CSV output.
 */
function escapeCsvCell(value) {
    if (value === null || value === undefined) {
        return '""';
    }
    const stringValue = String(value);
    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n") ||
        stringValue.includes("\r")
    ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return `"${stringValue}"`;
}

/**
 * Exports an array of objects to a CSV file and triggers automatic browser download.
 *
 * @param {string} filename - Filename to save (e.g. "inventory_export.csv")
 * @param {Array<Object>} rows - Array of row objects
 * @param {Array<{ key: string, label: string }>} columns - Column definitions
 */
export function exportToCsv(filename, rows = [], columns = []) {
    if (typeof window === "undefined") return;

    if (!rows || rows.length === 0) {
        alert("No data available to export.");
        return;
    }

    // Determine columns if not explicitly provided
    let cols = columns;
    if (!cols || cols.length === 0) {
        const keys = Object.keys(rows[0] || {});
        cols = keys.map((k) => ({ key: k, label: k }));
    }

    // Header line
    const headerLine = cols.map((c) => escapeCsvCell(c.label || c.key)).join(",");

    // Body lines
    const dataLines = rows.map((row) => {
        return cols
            .map((c) => {
                let val;
                // Handle dotted keys like "product.name"
                if (c.key.includes(".")) {
                    const parts = c.key.split(".");
                    val = parts.reduce((acc, part) => acc?.[part], row);
                } else {
                    val = row[c.key];
                }
                return escapeCsvCell(val);
            })
            .join(",");
    });

    const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const cleanFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Parses a CSV string into an array of row objects.
 * Accurately handles commas inside quotes and multiline rows.
 *
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} - Array of parsed objects
 */
export function parseCsv(csvText) {
    if (!csvText || typeof csvText !== "string") return [];

    const lines = [];
    let currentLine = [];
    let currentCell = "";
    let insideQuotes = false;

    // Normalize line breaks
    const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // Skip escaped quote
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            currentLine.push(currentCell.trim());
            currentCell = "";
        } else if (char === "\n" && !insideQuotes) {
            currentLine.push(currentCell.trim());
            if (currentLine.some((c) => c !== "")) {
                lines.push(currentLine);
            }
            currentLine = [];
            currentCell = "";
        } else {
            currentCell += char;
        }
    }

    if (currentCell.length > 0 || currentLine.length > 0) {
        currentLine.push(currentCell.trim());
        if (currentLine.some((c) => c !== "")) {
            lines.push(currentLine);
        }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map((h) =>
        h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        const rowObj = {};
        let hasValue = false;

        headers.forEach((header, index) => {
            const rawVal = row[index] !== undefined ? row[index] : "";
            rowObj[header] = rawVal;
            if (rawVal !== "") hasValue = true;
        });

        if (hasValue) {
            result.push(rowObj);
        }
    }

    return result;
}

/**
 * Generates and triggers download of a sample CSV template for bulk product import.
 */
export function downloadProductImportTemplate() {
    const templateData = [
        {
            name: "Industrial Steel Bolt 10mm",
            sku: "BOLT-10MM-001",
            categoryId: "1",
            price: "14.50",
            description: "High tensile steel bolt for heavy assemblies",
            status: "ACTIVE",
        },
        {
            name: "Rubber Sealing Gasket",
            sku: "GSKT-RBR-042",
            categoryId: "1",
            price: "45.00",
            description: "Waterproof synthetic rubber pipe gasket",
            status: "ACTIVE",
        },
        {
            name: "Precision Ball Bearing 608RS",
            sku: "BRG-608RS-010",
            categoryId: "2",
            price: "120.00",
            description: "Dual rubber sealed radial ball bearing",
            status: "ACTIVE",
        },
    ];

    const columns = [
        { key: "name", label: "name" },
        { key: "sku", label: "sku" },
        { key: "categoryId", label: "categoryId" },
        { key: "price", label: "price" },
        { key: "description", label: "description" },
        { key: "status", label: "status" },
    ];

    exportToCsv("StockPilot_Product_Import_Template.csv", templateData, columns);
}
