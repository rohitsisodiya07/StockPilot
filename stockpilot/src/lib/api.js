
import axios from "axios";

const api = axios.create({
    baseURL: typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000/api"),
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = sessionStorage.getItem("stockpilot_token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Prevent duplicate /api/api prefix
        if (config.url?.startsWith("/api/")) {
            config.url = config.url.replace(/^\/api/, "");
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// In-flight GET request deduplication (prevents React StrictMode & duplicate mount double-fetching)
const inFlightRequests = new Map();
const originalGet = api.get.bind(api);

api.get = function (url, config = {}) {
    if (typeof window === "undefined" || config?.params?.refresh) {
        return originalGet(url, config);
    }

    const key = `${url}_${JSON.stringify(config?.params || {})}`;
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
    }

    const promise = originalGet(url, config).finally(() => {
        setTimeout(() => {
            inFlightRequests.delete(key);
        }, 300);
    });

    inFlightRequests.set(key, promise);
    return promise;
};

export default api;
