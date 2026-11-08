// casiguro-app/src/utils/categoryAPI.ts
import { apiRequest } from "./RestAPI";
import type { Category } from "@/types";

export interface CategoryPayload {
  name: string;
  description?: string;
}

export function getCategories(): Promise<Category[]> {
  return apiRequest("/api/categories", { method: "GET" });
}

export function createCategory(payload: CategoryPayload): Promise<Category> {
  return apiRequest("/api/categories", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCategory(id: string, payload: CategoryPayload): Promise<Category> {
  return apiRequest(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteCategory(id: string): Promise<{ id: string; message: string }> {
  return apiRequest(`/api/categories/${id}`, { method: "DELETE" });
}

// Names for the category dropdown on custom order/quotation lines. "General" (no category) always comes first.
export function categoryOptionNames(categories: Category[]): string[] {
  return ["General", ...categories.map((category) => category.name).filter((name) => name.toLowerCase() !== "general")];
}

// Keeps a line's current category selectable even if it was renamed or deleted since the line was added
export function withCurrent(names: string[], current?: string | null): string[] {
  return current && !names.includes(current) ? [...names, current] : names;
}
