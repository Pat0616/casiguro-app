import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronDown, Clock, Download, History, Loader2, MessageSquareQuote, Monitor, Search, X } from "lucide-react";
import type { Account, AuditCategory, AuditLogEntry } from "@/types";
import { cn } from "@/lib/utils";
import { ACTIVITY, auditEvent } from "@/lib/activityIcons";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { downloadAuditLogCsv, getAuditLogs, type AuditLogFilters } from "@/utils/accountAPI";
import {
  AUDIT_CATEGORY,
  DATE_PRESETS,
  FLAGGED_ACTIONS,
  fieldLabel,
  formatChangeValue,
  formatDay,
  formatTime,
  formatTimeWithSeconds,
  parseServerDate,
  presetRange,
  splitReason,
  type DatePreset,
} from "./accountMeta";

const CATEGORY_FILTERS: (AuditCategory | "all")[] = ["all", "auth", "order", "payment", "quotation", "catalog", "account"];
// Changes shown before "Show all n changes"
const CHANGES_PREVIEW = 4;

interface AccountAuditLogProps {
  account: Account;
  category: AuditCategory | "all";
  onCategoryChange: (category: AuditCategory | "all") => void;
}

// Everything a search can match for one entry, lower-cased
function searchText(entry: AuditLogEntry): string {
  const meta = ACTIVITY[auditEvent(entry)];
  const changes = entry.changes
    ? Object.entries(entry.changes).map(([field, c]) => `${fieldLabel(field)} ${String(c?.from ?? "")} ${String(c?.to ?? "")}`)
    : [];
  return [entry.description, entry.entityLabel, entry.action, meta?.label, ...changes].filter(Boolean).join(" ").toLowerCase();
}

export default function AccountAuditLog({ account, category, onCategoryChange }: AccountAuditLogProps) {
  const [dates, setDates] = useState({ from: "", to: "" });
  const [preset, setPreset] = useState<DatePreset | "custom">("all");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Entries whose full change list is open (the first few changes always show)
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

  const choosePreset = (key: DatePreset) => {
    setPreset(key);
    setDates(presetRange(key));
  };
  const setCustomDate = (field: "from" | "to", value: string) => {
    setPreset("custom");
    setDates((d) => ({ ...d, [field]: value }));
  };

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Search filters the loaded entries; then group by calendar day (entries are newest first)
  const query = search.trim().toLowerCase();
  const visible = useMemo(
    () => (query ? entries.filter((entry) => searchText(entry).includes(query)) : entries),
    [entries, query]
  );
  const days = useMemo(() => {
    const groups: { day: string; entries: AuditLogEntry[] }[] = [];
    for (const entry of visible) {
      const date = parseServerDate(entry.createdAt);
      const day = date ? formatDay(date) : "Unknown date";
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.entries.push(entry);
      else groups.push({ day, entries: [entry] });
    }
    return groups;
  }, [visible]);

  return (
    <Card className="flex min-w-0 flex-col">
      {/* Title */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            <History className="h-5 w-5 text-sky-600" />
            Activity log
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Every action performed by {account.fullName}. Entries are permanent and can't be edited or deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SOA No, customer, quotation, item, reason..."
            aria-label="Search the activity log"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORY_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              aria-pressed={category === key}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                category === key ? "bg-sky-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-sky-700"
              )}
            >
              {key === "all" ? "All activity" : AUDIT_CATEGORY[key].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Date range">
            {DATE_PRESETS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => choosePreset(key)}
                aria-pressed={preset === key}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                  preset === key ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <label className="flex items-center gap-1.5">
              From
              <input
                type="date"
                value={dates.from}
                max={dates.to || undefined}
                onChange={(e) => setCustomDate("from", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
            <label className="flex items-center gap-1.5">
              To
              <input
                type="date"
                value={dates.to}
                min={dates.from || undefined}
                onChange={(e) => setCustomDate("to", e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && query && entries.length > 0 && (
        <p className="border-b border-slate-100 px-5 py-2.5 text-sm text-slate-600">
          <strong className="text-slate-900">{visible.length}</strong> of {entries.length} loaded{" "}
          {entries.length === 1 ? "entry matches" : "entries match"} "<span className="font-semibold">{search.trim()}</span>"
          {nextCursor && <span className="text-slate-400"> · load older activity below to search further back</span>}
        </p>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading activity...</p>
      ) : visible.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={History}
            title={query ? "No matching activity" : "No activity found"}
            subtitle={query ? "Try another word, or load older activity." : "Nothing matches these filters yet."}
          />
        </div>
      ) : (
        <div>
          {days.map((group) => (
            <section key={group.day}>
              {/* Day header stays visible under the app header while scrolling through that day */}
              <h4 className="sticky top-16 z-10 flex items-center justify-between gap-2 border-y border-slate-200 bg-slate-50/95 px-5 py-2 text-sm font-bold text-slate-700 backdrop-blur">
                {group.day}
                <span className="text-xs font-semibold text-slate-400">
                  {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                </span>
              </h4>
              <ol className="px-3 py-3 sm:px-5">
                {group.entries.map((entry, index) => (
                  <AuditEntry
                    key={entry.id}
                    entry={entry}
                    last={index === group.entries.length - 1}
                    showAll={expanded.has(entry.id)}
                    onToggle={() => toggle(entry.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
          <span>
            Showing {query ? `${visible.length} of ` : ""}
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
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

// One entry on the timeline: time on the left (desktop), icon dot on the line, and the card
function AuditEntry({
  entry,
  last,
  showAll,
  onToggle,
}: {
  entry: AuditLogEntry;
  last: boolean;
  showAll: boolean;
  onToggle: () => void;
}) {
  const date = parseServerDate(entry.createdAt);
  const category = AUDIT_CATEGORY[entry.category] || AUDIT_CATEGORY.account;
  const meta = ACTIVITY[auditEvent(entry)] || category;
  const Icon = meta.icon;
  const flag = FLAGGED_ACTIONS[entry.action];
  const { text, reason } = splitReason(entry);
  const changes = entry.changes ? Object.entries(entry.changes) : [];
  const shownChanges = showAll ? changes : changes.slice(0, CHANGES_PREVIEW);
  const ip = entry.ipAddress === "::1" || entry.ipAddress === "127.0.0.1" ? "This computer" : entry.ipAddress;

  return (
    <li className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[5.5rem_2.25rem_minmax(0,1fr)]">
      <p className="hidden pt-3 text-right text-sm font-semibold text-slate-600 md:block">{date ? formatTime(date) : "—"}</p>

      {/* Icon on the timeline line */}
      <div className="relative flex justify-center">
        {!last && <span className="absolute bottom-0 top-3 w-px bg-slate-200" aria-hidden="true" />}
        <span className={cn("relative mt-2 flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white", meta.tint)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <article
        className={cn(
          "mb-4 min-w-0 rounded-xl border border-slate-200 px-4 py-3.5 shadow-sm",
          flag ? `border-l-4 ${flag}` : "bg-white"
        )}
      >
        <header className="flex flex-wrap items-center gap-2">
          <span title={entry.action} className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold", meta.tint)}>
            {meta.label}
          </span>
          {entry.entityLabel && (
            <span className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800" title={entry.entityLabel}>
              {entry.entityLabel}
            </span>
          )}
          <span className="ml-auto text-xs font-medium uppercase tracking-wide text-slate-400">
            <span className="md:hidden">{date ? formatTime(date) : ""} · </span>
            {category.label}
          </span>
        </header>

        <p className="mt-2 text-[15px] leading-relaxed text-slate-800">{text}</p>

        {reason && (
          <div className="mt-3 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Reason</p>
              <p className="mt-0.5 break-words text-sm text-amber-950">{reason}</p>
            </div>
          </div>
        )}

        {changes.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Field</span>
              <span>Before</span>
              <span>After</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {shownChanges.map(([field, change]) => {
                const from = formatChangeValue(field, change?.from);
                const to = formatChangeValue(field, change?.to);
                const added = from === "—" && to !== "—";
                const removed = to === "—" && from !== "—";
                return (
                  <li key={field} className="grid gap-x-3 gap-y-0.5 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <span className="font-medium text-slate-700">{fieldLabel(field)}</span>
                    <span className="break-words">
                      <span className="mr-1 text-xs text-slate-400 sm:hidden">Before</span>
                      <span
                        className={cn(
                          from === "—"
                            ? "text-slate-300"
                            : removed
                              ? "text-rose-600 line-through decoration-rose-300"
                              : "text-slate-400 line-through decoration-slate-300"
                        )}
                      >
                        {from}
                      </span>
                    </span>
                    <span className={cn("break-words font-semibold", added ? "text-emerald-700" : "text-slate-900")}>
                      <span className="mr-1 text-xs font-normal text-slate-400 sm:hidden">After</span>
                      {to}
                    </span>
                  </li>
                );
              })}
            </ul>
            {changes.length > CHANGES_PREVIEW && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={showAll}
                className="flex w-full items-center justify-center gap-1 border-t border-slate-100 bg-slate-50 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
              >
                {showAll ? "Show fewer" : `Show all ${changes.length} changes`}
                <ChevronDown className={cn("h-4 w-4 transition", showAll && "rotate-180")} />
              </button>
            )}
          </div>
        )}

        <footer className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {date ? formatTimeWithSeconds(date) : "—"}
          </span>
          {ip && (
            <span className="inline-flex items-center gap-1" title={entry.userAgent || undefined}>
              <Monitor className="h-3.5 w-3.5" />
              {ip}
            </span>
          )}
        </footer>
      </article>
    </li>
  );
}
