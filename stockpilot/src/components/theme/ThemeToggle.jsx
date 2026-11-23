"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "", showLabel = false }) {
    const { theme, toggleTheme, mounted } = useTheme();

    if (!mounted) {
        return (
            <div className={`h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`} />
        );
    }

    const isDark = theme === "dark";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition duration-150 cursor-pointer ${className}`}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            <div className="relative h-4 w-4">
                {isDark ? (
                    <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0" />
                ) : (
                    <Moon className="h-4 w-4 text-indigo-600 transition-transform rotate-0" />
                )}
            </div>
            {showLabel && (
                <span className="text-xs font-semibold">
                    {isDark ? "Light Mode" : "Dark Mode"}
                </span>
            )}
        </button>
    );
}
