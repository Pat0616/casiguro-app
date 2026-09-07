// src/api/auth.ts
import { apiRequest } from "./RestAPI";

// Login user
export function login(email: string, password: string) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Register user
export function register(full_name: string, password: string, email: string) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name, password, email }),
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
