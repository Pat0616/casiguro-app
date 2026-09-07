// src/api/api.ts

const BASE_URL = "http://localhost:5000"; // your backend port

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

  if (!response.ok) {
    throw new Error(data.message || "API Error");
    console.log("API Failed");
  }

  return data;
}