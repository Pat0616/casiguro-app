import { Fragment, useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, Download, History, Loader2 } from "lucide-react";
import type { Account, AuditCategory, AuditLogEntry } from "@/types";
import { cn } from "@/lib/utils";
import { ACTIVITY, auditEvent } from "@/lib/activityIcons";
import Card from "@/components/ui/Card";
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
const COLUMN_COUNT = 6;

interface AccountAuditLogProps {
  account: Account;
  category: AuditCategory | "all";
  onCategoryChange: (category: AuditCategory | "all") => void;
}

export default function AccountAuditLog({ account, category, onCategoryChange }: AccountAuditLogProps) {
  const [dates, setDates] = useState({ from: "", to: "" });
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const filters: AuditLogFilters = { category, ...dates };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await getAuditLogs(account.id, { category, ...dates });
      setEntries(page.entries);
      setNextCursor(page.nextCursor);
      setExpanded(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [account.id, category, dates]);

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

  // Entries are newest first; a header row starts each calendar day
  let lastDay = "";

  return (
    <Card className="flex min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
            <History className="h-4 w-4 text-sky-600" />
            Activity log
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Every action performed by {account.fullName}. Entries are permanent and can't be edited or deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              aria-pressed={category === key}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                category === key ? "bg-sky-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-sky-700"
              )}
            >
              {key === "all" ? "All activity" : AUDIT_CATEGORY[key].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            From
            <input type="date" value={dates.from} max={dates.to || undefined} onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
          </label>
          <label className="flex items-center gap-1.5">
            To
            <input type="date" value={dates.to} min={dates.from || undefined} onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
          </label>
          {(dates.from || dates.to) && (
            <button type="button" onClick={() => setDates({ from: "", to: "" })} className="font-semibold text-sky-700 hover:text-sky-800">
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading activity...</p>
      ) : entries.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={History} title="No activity found" subtitle="Nothing matches these filters yet." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="w-24 px-5 py-2.5">Time</th>
                <th className="w-44 px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Activity</th>
                <th className="w-40 px-3 py-2.5">Record</th>
                <th className="w-32 px-3 py-2.5">IP address</th>
                <th className="w-28 px-5 py-2.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const date = parseServerDate(entry.createdAt);
                const day = date ? formatDay(date) : "";
                const showDay = day !== lastDay;
                lastDay = day;
                const category = AUDIT_CATEGORY[entry.category] || AUDIT_CATEGORY.account;
                const meta = ACTIVITY[auditEvent(entry)] || category;
                const Icon = meta.icon;
                const changeEntries = entry.changes ? Object.entries(entry.changes) : [];
                const isOpen = expanded.has(entry.id);
                const flag = FLAGGED_ACTIONS[entry.action];
                return (
                  <Fragment key={entry.id}>
                    {showDay && (
                      <tr className="bg-slate-50">
                        <td colSpan={COLUMN_COUNT} className="border-y border-slate-100 px-5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          {day}
                        </td>
                      </tr>
                    )}
                    <tr className={cn("align-top border-b border-slate-100", flag && "border-l-4", flag)}>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{date ? formatTime(date) : "—"}</td>
                      <td className="px-3 py-3">
                        <span title={category.label} className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold", meta.tint)}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-800">{entry.description}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">{entry.action}</p>
                      </td>
                      <td className="px-3 py-3">
                        {entry.entityLabel ? (
                          <span className="inline-block max-w-full truncate rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700" title={entry.entityLabel}>
                            {entry.entityLabel}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500" title={entry.userAgent || undefined}>
                        {entry.ipAddress === "::1" || entry.ipAddress === "127.0.0.1" ? "This computer" : entry.ipAddress || "—"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {changeEntries.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggle(entry.id)}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                          >
                            {changeEntries.length} change{changeEntries.length === 1 ? "" : "s"}
                            <ChevronDown className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-180")} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-sky-50/30">
                        <td />
                        <td colSpan={COLUMN_COUNT - 1} className="px-3 pb-4 pt-1">
                          <table className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white text-xs">
                            <thead className="bg-slate-50">
                              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                                <th className="px-3 py-1.5 font-semibold">Field</th>
                                <th className="px-3 py-1.5 font-semibold">Before</th>
                                <th className="px-3 py-1.5 font-semibold">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              {changeEntries.map(([field, change]) => (
                                <tr key={field} className="border-t border-slate-100 align-top">
                                  <td className="px-3 py-1.5 font-medium text-slate-600">{fieldLabel(field)}</td>
                                  <td className="break-all px-3 py-1.5 text-slate-400 line-through decoration-slate-300">{formatChangeValue(field, change?.from)}</td>
                                  <td className="break-all px-3 py-1.5 font-semibold text-slate-800">{formatChangeValue(field, change?.to)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>
            Showing {entries.length} entr{entries.length === 1 ? "y" : "ies"}
            {nextCursor ? " (older entries available)" : ""}
          </span>
          {nextCursor && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load older activity"}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
