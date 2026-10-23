// src/api/auth.ts
import { apiRequest } from "./RestAPI";

// Login user
export function login(email: string, password: string) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Registration, step 1: validates the form and emails a 6-digit code. No account exists yet.
// Fails with a specific message if the email was rejected before, is pending, or already has an account.
export function startRegistration(details: {
  full_name: string;
  email: string;
  contact_number: string;
  password: string;
}): Promise<{ message: string; email: string; expiresInMinutes: number; resendAfterSeconds: number }> {
  return apiRequest("/api/auth/register/start", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

// Registration, step 2: the code is checked and the account is created as a pending employee for admin approval
export function verifyRegistration(email: string, code: string) {
  return apiRequest("/api/auth/register/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resendRegistrationCode(email: string): Promise<{ message: string; resendAfterSeconds: number }> {
  return apiRequest("/api/auth/register/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
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
