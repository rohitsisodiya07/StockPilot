"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const ROLE_ROUTES = {
  1: "/admin/dashboard",
  4: "/manager/dashboard",
  5: "/warehouse/dashboard",
};

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const result = response.data?.data;
      const token = result?.token;
      const user = result?.user;

      if (!response.data?.success || !token || !user) {
        setError("Unable to sign in. Please try again.");
        return;
      }

      const dashboard = ROLE_ROUTES[Number(user.roleId)];

      if (!dashboard) {
        setError("Your account does not have an assigned dashboard.");
        return;
      }

      // Current backend expects Bearer tokens in protected API requests.
      sessionStorage.setItem("stockpilot_token", token);

      sessionStorage.setItem("stockpilot_user", JSON.stringify(user));
      console.log(">>>>>user", user);
      

      router.replace(dashboard);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (status === 400) {
        setError(
          err.response?.data?.message || "Please enter valid login details."
        );
      } else if (!err.response) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(
          err.response?.data?.message ||
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] font-sans text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Branding panel */}
        <section className="relative hidden min-h-screen overflow-hidden bg-[#101b35] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl"
          />

          {/* Brand */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  d="M5 15.5 20 7l15 8.5v17H5v-17Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="m5 15.5 15 9 15-9M20 24.5V32"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 19.5v6m16-6v6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Stock<span className="text-blue-400">Pilot</span>
            </span>
          </div>

          {/* Main content */}
          <div className="relative my-12 max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your inventory, under control
            </div>

            <h1 className="text-4xl font-semibold leading-[1.18] tracking-tight xl:text-6xl">
              Clarity for your stock.
              <span className="mt-2 block text-blue-400">
                Confidence in every move.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Bring your products, warehouses and orders together in one
              organized workspace. Spend less time tracking stock and more
              time moving your business forward.
            </p>

            {/* Dashboard preview */}
            <div className="mt-10 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Inventory overview
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your operations at a glance
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 text-blue-300"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 19V5m0 14h16M8 15l4-4 3 2 5-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Products", value: "Track" },
                  { label: "Stock", value: "Monitor" },
                  { label: "Orders", value: "Manage" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/[0.08] bg-black/10 p-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} StockPilot</span>
            <span>Inventory Management, Simplified</span>
          </div>
        </section>

        {/* Login section */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-10 xl:px-16">
          <div className="w-full max-w-[420px]">
            {/* Mobile brand */}
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    d="M5 15.5 20 7l15 8.5v17H5v-17Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m5 15.5 15 9 15-9M20 24.5V32"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Stock<span className="text-blue-600">Pilot</span>
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Welcome to StockPilot
              </p>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-[38px]">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to manage your inventory and operations.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-16 text-sm shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 8v4m0 3h.01"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to your account
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                Secure account access
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Authorized users only
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your account is created by your administrator. Contact
                    them if you need access.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              © {new Date().getFullYear()} StockPilot. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
