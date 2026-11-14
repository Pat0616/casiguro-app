// src/utils/RestAPI.ts

// Backend address: VITE_API_URL in .env (on Vercel, the deployed backend URL); local backend if unset.
// Without a scheme the browser would treat it as a path on the frontend's own host (whose catch-all rewrite answers
// with index.html), so a bare host like "api.example.com" is read as https://api.example.com.
function resolveBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || "").trim() || "http://localhost:5000";
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (url !== raw) console.warn(`VITE_API_URL "${raw}" has no http(s)://; using ${url}`);
  return url.replace(/\/+$/, "");
}
export const BASE_URL = resolveBaseUrl();

// A wrapper for fetch
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include", // important for cookies!!
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  // Anything that isn't JSON (e.g. an HTML page from a wrong VITE_API_URL) is not our API answering
  if (!(response.headers.get("content-type") || "").includes("application/json") && response.status !== 204) {
    throw Object.assign(new Error(`The server at ${BASE_URL} did not respond like the Casiguro API.`), {
      status: response.status,
    });
  }

  const data = await response.json().catch(() => ({}));

  // Session ended server-side (e.g. account deactivated): let the app sign the user out
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:expired", { detail: data.message }));
  }

  if (!response.ok) {
    // status lets callers react to specific failures (e.g. 409 = someone else saved first)
    throw Object.assign(new Error(data.message || "API Error"), { status: response.status });
    console.log("API Failed");
  }

  return data;
}