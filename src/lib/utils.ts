import { NOW } from "@/lib/constants";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export const pad = (n: number): string => String(n).padStart(2, "0");

export const isoDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const TODAY_KEY = isoDate(NOW);

export function formatCurrency(n: number): string {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysDiff(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const start = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function dueLabel(iso: string): { text: string; tone: string } {
  const diff = daysDiff(iso);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, tone: "text-rose-600" };
  if (diff === 0) return { text: "Due today", tone: "text-amber-600" };
  if (diff === 1) return { text: "Due tomorrow", tone: "text-amber-600" };
  if (diff <= 7) return { text: `Due in ${diff}d`, tone: "text-slate-600" };
  return { text: `Due ${formatDate(iso)}`, tone: "text-slate-500" };
}

export function relativeTime(date: Date): string {
  const diffMs = NOW.getTime() - date.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
