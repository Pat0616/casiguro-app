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

// Change the signed-in user's own password. Other sessions are signed out; this one gets a fresh cookie.
export function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Forgot password, step 1 (also used to resend): emails a 6-digit code if an active account uses this email.
// The reply is the same either way.
export function startPasswordReset(email: string): Promise<{ message: string; expiresInMinutes: number; resendAfterSeconds: number }> {
  return apiRequest("/api/auth/forgot-password/start", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Forgot password, step 2: the code is checked and the new password saved. The user then signs in normally.
export function resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
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
