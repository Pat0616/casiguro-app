// casiguro-app/src/utils/quotationAPI.ts
import { apiRequest } from "./RestAPI";
import type { Quotation, QuotationItem, QuotationStatus, Order } from "@/types";

export interface NewQuotationPayload {
  customerName: string;
  contactNumber?: string;
  validUntil: string;
  notes?: string;
  status?: "draft" | "sent";
  items: QuotationItem[];
}

export function getQuotations(params?: {
  status?: string;
  search?: string;
}): Promise<Quotation[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return apiRequest(`/api/quotations${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export function getQuotationById(id: string): Promise<Quotation> {
  return apiRequest(`/api/quotations/${id}`, { method: "GET" });
}

export function createQuotation(payload: NewQuotationPayload): Promise<Quotation> {
  return apiRequest("/api/quotations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuotation(id: string, payload: Partial<NewQuotationPayload>): Promise<Quotation> {
  return apiRequest(`/api/quotations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateQuotationStatus(
  id: string,
  status: QuotationStatus,
  rejectionReason?: string
): Promise<{ id: string; status: QuotationStatus; message: string }> {
  return apiRequest(`/api/quotations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, rejectionReason }),
  });
}

export function acceptAndConvertToOrder(
  id: string,
  payload?: { dueDate?: string; notes?: string }
): Promise<{ message: string; order: Order }> {
  return apiRequest(`/api/quotations/${id}/accept-and-convert`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}
