// casiguro-app/src/utils/customerAPI.ts
import { apiRequest } from "./RestAPI";

export interface CustomerSuggestion {
  id: string;
  name: string;
  contactNumber: string;
}

export function getCustomers(): Promise<CustomerSuggestion[]> {
  return apiRequest("/api/customers", { method: "GET" });
}
