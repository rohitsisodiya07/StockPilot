"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

export default function StockCharts({ chartData = [], stockTotals = { stockIn: 0, stockOut: 0 }, dateLabel, number }) {
    const formatNum = (val) => (number ? number(val) : Number(val || 0).toLocaleString("en-IN"));

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Stock IN vs OUT Bar Chart */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Stock IN vs OUT
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Daily quantity comparison
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-100 dark:border-emerald-900/40">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            Total IN
                        </p>

                        <p className="mt-1.5 text-xl font-extrabold text-emerald-800 dark:text-emerald-300">
                            {formatNum(stockTotals.stockIn)}
                        </p>
                    </div>

                    <div className="rounded-xl bg-orange-50 dark:bg-orange-950/40 p-3 border border-orange-100 dark:border-orange-900/40">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                            Total OUT
                        </p>

                        <p className="mt-1.5 text-xl font-extrabold text-orange-800 dark:text-orange-300">
                            {formatNum(stockTotals.stockOut)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 h-[280px] w-full">
                    {chartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -10,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                    className="dark:stroke-slate-800"
                                />

                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => {
                                        const date = new Date(`${value}T12:00:00`);
                                        return Number.isNaN(date.getTime())
                                            ? value
                                            : date.toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                            });
                                    }}
                                    tick={{ fontSize: 11 }}
                                    minTickGap={18}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                />

                                <Tooltip
                                    labelFormatter={dateLabel}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        borderColor: "#334155",
                                        borderRadius: "0.75rem",
                                        color: "#f8fafc",
                                        fontSize: "12px",
                                    }}
                                />

                                <Legend
                                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                />

                                <Bar
                                    dataKey="stockIn"
                                    name="Stock IN"
                                    fill="#059669"
                                    radius={[5, 5, 0, 0]}
                                />

                                <Bar
                                    dataKey="stockOut"
                                    name="Stock OUT"
                                    fill="#ea580c"
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            No stock movement chart data returned for this period.
                        </div>
                    )}
                </div>
            </div>

            {/* Inventory Trend Line Chart */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Inventory Trend
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Daily IN and OUT flow trend
                </p>

                <div className="mt-4 h-[356px] w-full">
                    {chartData.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 15,
                                    right: 15,
                                    left: -10,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                    className="dark:stroke-slate-800"
                                />

                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => {
                                        const date = new Date(`${value}T12:00:00`);
                                        return Number.isNaN(date.getTime())
                                            ? value
                                            : date.toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                            });
                                    }}
                                    tick={{ fontSize: 11 }}
                                    minTickGap={18}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 11 }}
                                />

                                <Tooltip
                                    labelFormatter={dateLabel}
                                    contentStyle={{
                                        backgroundColor: "#0f172a",
                                        borderColor: "#334155",
                                        borderRadius: "0.75rem",
                                        color: "#f8fafc",
                                        fontSize: "12px",
                                    }}
                                />

                                <Legend
                                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="stockIn"
                                    name="Stock IN"
                                    stroke="#059669"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="stockOut"
                                    name="Stock OUT"
                                    stroke="#ea580c"
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            No stock trend data returned for this period.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
