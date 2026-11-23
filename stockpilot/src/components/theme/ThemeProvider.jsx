"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "light",
    toggleTheme: () => {},
    mounted: false,
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("stockpilot_theme");
        const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

        if (isDark) {
            setTheme("dark");
            document.documentElement.classList.add("dark");
            document.body?.classList.add("dark");
        } else {
            setTheme("light");
            document.documentElement.classList.remove("dark");
            document.body?.classList.remove("dark");
        }
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => {
            const nextTheme = prev === "dark" ? "light" : "dark";
            localStorage.setItem("stockpilot_theme", nextTheme);
            if (nextTheme === "dark") {
                document.documentElement.classList.add("dark");
                document.body?.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
                document.body?.classList.remove("dark");
            }
            return nextTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
