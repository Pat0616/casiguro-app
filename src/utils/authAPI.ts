// src/api/auth.ts
import { apiRequest } from "./RestAPI";

// Login user
export function login(email: string, password: string) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Register user — the account is created as a pending employee until an admin approves it
export function register(details: { full_name: string; email: string; contact_number: string; password: string }) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

// Get current logged-in user
export function getMe() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}

// Logout user
export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST"
  });
}
