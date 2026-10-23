// casiguro-app/src/utils/reportAPI.ts
import { BASE_URL } from "./RestAPI";

export interface SalesExportPeriod {
  mode: "year" | "month";
  year: string;
  month: string; // 1-12, ignored in year mode
}

// Downloads the Sales Monitoring workbook (Casiguro's own sheet layout + a summary sheet) for a year or month
export async function downloadSalesExcel({ mode, year, month }: SalesExportPeriod) {
  const params = new URLSearchParams({ mode, year });
  if (mode === "month") params.set("month", month);
  const response = await fetch(`${BASE_URL}/api/reports/sales.xlsx?${params}`, { credentials: "include" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Failed to export sales");
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `Casiguro_Sales_${mode === "year" ? year : `${year}-${month.padStart(2, "0")}`}.xlsx`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
