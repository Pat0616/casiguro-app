// src/api/api.ts

export const BASE_URL = "http://localhost:5000"; // your backend port

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