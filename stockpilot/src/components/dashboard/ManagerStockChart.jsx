"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

export default function ManagerStockChart({ chartData = [] }) {
    if (!chartData || chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-xs text-gray-500">
                No stock movement data available.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                        })
                    }
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                    dataKey="stockIn"
                    name="Stock IN"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="stockOut"
                    name="Stock OUT"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
