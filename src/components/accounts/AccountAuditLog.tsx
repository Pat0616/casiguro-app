import { Fragment, useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, Download, History, Loader2 } from "lucide-react";
import type { Account, AuditCategory, AuditLogEntry } from "@/types";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";
import { downloadAuditLogCsv, getAuditLogs, type AuditLogFilters } from "@/utils/accountAPI";
import {
  AUDIT_CATEGORY,
  FLAGGED_ACTIONS,
  fieldLabel,
  formatChangeValue,
  formatDay,
  formatTime,
  parseServerDate,
} from "./accountMeta";

const CATEGORY_FILTERS: (AuditCategory | "all")[] = ["all", "auth", "order", "payment", "quotation", "catalog", "account"];

export default function AccountAuditLog({ account }: { account: Account }) {
  const [filters, setFilters] = useState<AuditLogFilters>({ category: "all", from: "", to: "" });
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getAuditLogs(account.id, filters);
      setEntries(page.entries);
      setNextCursor(page.nextCursor);
      setExpanded(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [account.id, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      const page = await getAuditLogs(account.id, filters, nextCursor);
      setEntries((prev) => [...prev, ...page.entries]);
      setNextCursor(page.nextCursor);
    } catch (err: any) {
      setError(err.message || "Failed to load more entries.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const date = new Date().toISOString().slice(0, 10);
      await downloadAuditLogCsv(account.id, filters, `audit-log_${account.fullName.replace(/\s+/g, "-")}_${date}.csv`);
    } catch (err: any) {
      setError(err.message || "Failed to export.");
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Group consecutive entries by calendar day (entries are newest first)
  let lastDay = "";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
            <History className="h-4 w-4 text-sky-600" />
            Activity log
          </h3>
          <p className="text-xs text-slate-500">Only actions performed by {account.fullName}. Entries can't be edited or deleted.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export CSV
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, category }))}
              aria-pressed={filters.category === category}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                filters.category === category ? "bg-sky-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-sky-700"
              )}
            >
              {category === "all" ? "All activity" : AUDIT_CATEGORY[category].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            From
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
          </label>
          <label className="flex items-center gap-1.5">
            To
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
          </label>
          {(filters.from || filters.to) && (
            <button type="button" onClick={() => setFilters((f) => ({ ...f, from: "", to: "" }))} className="font-semibold text-sky-700 hover:text-sky-800">
              Clear dates
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading activity...</p>
      ) : entries.length === 0 ? (
        <EmptyState icon={History} title="No activity found" subtitle="Nothing matches these filters yet." />
      ) : (
        <ol className="space-y-1.5">
          {entries.map((entry) => {
            const date = parseServerDate(entry.createdAt);
            const day = date ? formatDay(date) : "";
            const showDay = day !== lastDay;
            lastDay = day;
            const meta = AUDIT_CATEGORY[entry.category] || AUDIT_CATEGORY.account;
            const Icon = meta.icon;
            const changeEntries = entry.changes ? Object.entries(entry.changes) : [];
            const isOpen = expanded.has(entry.id);
            return (
              <Fragment key={entry.id}>
                {showDay && <li className="pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 first:pt-0">{day}</li>}
                <li className={cn("rounded-lg border border-l-4 border-slate-200 bg-white px-3 py-2.5", FLAGGED_ACTIONS[entry.action] || "border-l-slate-200")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", meta.tint)}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800">{entry.description}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500">{date ? formatTime(date) : "—"}</span>
                        <span className="font-mono">{entry.action}</span>
                        {entry.entityLabel && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600">{entry.entityLabel}</span>}
                        {entry.ipAddress && <span>IP {entry.ipAddress}</span>}
                      </p>
                    </div>
                    {changeEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggle(entry.id)}
                        aria-expanded={isOpen}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        {changeEntries.length} change{changeEntries.length === 1 ? "" : "s"}
                        <ChevronDown className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {isOpen && (
                    <table className="mt-2 w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                          <th className="py-1 pr-3 font-semibold">Field</th>
                          <th className="py-1 pr-3 font-semibold">Before</th>
                          <th className="py-1 font-semibold">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changeEntries.map(([field, change]) => (
                          <tr key={field} className="border-t border-slate-100 align-top">
                            <td className="py-1.5 pr-3 font-medium text-slate-600">{fieldLabel(field)}</td>
                            <td className="break-all py-1.5 pr-3 text-slate-400 line-through decoration-slate-300">{formatChangeValue(field, change?.from)}</td>
                            <td className="break-all py-1.5 font-semibold text-slate-800">{formatChangeValue(field, change?.to)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      )}

      {nextCursor && !loading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load older activity"}
          </button>
        </div>
      )}
    </section>
  );
}
