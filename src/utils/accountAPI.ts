// casiguro-app/src/utils/accountAPI.ts
// Admin-only account management and per-account audit logs
import { apiRequest, BASE_URL } from "./RestAPI";
import type { Account, AuditCategory, AuditLogEntry } from "@/types";

export const PROMOTE_CONFIRMATION_PHRASE = "Confirm Account Admin For Casiguro";

export function getAccounts(): Promise<Account[]> {
  return apiRequest("/api/accounts", { method: "GET" });
}

export function getPendingAccountCount(): Promise<{ pendingCount: number }> {
  return apiRequest("/api/accounts/pending-count", { method: "GET" });
}

export function approveAccount(id: string): Promise<Account> {
  return apiRequest(`/api/accounts/${id}/approve`, { method: "PATCH" });
}

export function rejectAccount(id: string, reason?: string): Promise<Account> {
  return apiRequest(`/api/accounts/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function deactivateAccount(id: string, reason?: string): Promise<Account> {
  return apiRequest(`/api/accounts/${id}/deactivate`, { method: "PATCH", body: JSON.stringify({ reason }) });
}

export function reactivateAccount(id: string): Promise<Account> {
  return apiRequest(`/api/accounts/${id}/reactivate`, { method: "PATCH" });
}

export function promoteAccount(id: string, confirmation: string, password: string): Promise<Account> {
  return apiRequest(`/api/accounts/${id}/promote`, { method: "POST", body: JSON.stringify({ confirmation, password }) });
}

export interface AuditLogFilters {
  category?: AuditCategory | "all";
  from?: string;
  to?: string;
}

function filterQuery(filters: AuditLogFilters, before?: number | null) {
  const query = new URLSearchParams();
  if (filters.category && filters.category !== "all") query.set("category", filters.category);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (before) query.set("before", String(before));
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export function getAuditLogs(
  accountId: string,
  filters: AuditLogFilters,
  before?: number | null
): Promise<{ entries: AuditLogEntry[]; nextCursor: number | null }> {
  return apiRequest(`/api/accounts/${accountId}/audit-logs${filterQuery(filters, before)}`, { method: "GET" });
}

export async function downloadAuditLogCsv(accountId: string, filters: AuditLogFilters, filename: string) {
  const response = await fetch(`${BASE_URL}/api/accounts/${accountId}/audit-logs/export${filterQuery(filters)}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to export audit log");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
