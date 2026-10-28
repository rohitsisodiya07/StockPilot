
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children, allowedRoles = [] }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = sessionStorage.getItem("stockpilot_token");

        if (!token) {
            router.replace("/");
            return;
        }

        try {
            const payload = token.split(".")[1];
            const decoded = JSON.parse(atob(payload));

            if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
                sessionStorage.removeItem("stockpilot_token");
                router.replace("/");
                return;
            }

            if (
                allowedRoles.length > 0 &&
                !allowedRoles.includes(Number(decoded.roleId))
            ) {
                router.replace("/");
                return;
            }

            setIsAuthorized(true);
        } catch {
            sessionStorage.removeItem("stockpilot_token");
            router.replace("/");
        }
    }, [router, allowedRoles]);

    if (!isAuthorized) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="mt-4 text-sm text-slate-500">
                        Verifying your session...
                    </p>
                </div>
            </main>
        );
    }

    return children;
}
