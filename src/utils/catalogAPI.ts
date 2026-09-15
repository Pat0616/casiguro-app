// casiguro-app/src/utils/catalogAPI.ts
import { apiRequest } from "./RestAPI";
import type { CatalogItem, CatalogItemType } from "@/types";

export interface CatalogItemPayload {
  name: string;
  type: CatalogItemType;
  basePrice: number;
  description?: string;
  categoryId?: string | null;
  isStockItem?: boolean;
  isActive?: boolean;
}

export function getCatalogItems(params?: {
  type?: string;
  search?: string;
  includeInactive?: boolean;
}): Promise<CatalogItem[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.search) query.set("search", params.search);
  if (params?.includeInactive) query.set("includeInactive", "true");

  const qs = query.toString();
  return apiRequest(`/api/catalog${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export function createCatalogItem(payload: CatalogItemPayload): Promise<CatalogItem> {
  return apiRequest("/api/catalog", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCatalogItem(id: string, payload: Partial<CatalogItemPayload>): Promise<CatalogItem> {
  return apiRequest(`/api/catalog/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function toggleCatalogItemStatus(id: string, isActive?: boolean): Promise<{ id: string; isActive: boolean; message: string }> {
  return apiRequest(`/api/catalog/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

