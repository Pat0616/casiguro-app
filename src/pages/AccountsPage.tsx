import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Check, ChevronRight, RotateCcw, Search, ShieldCheck, UserCog, Users, X } from "lucide-react";
import type { Account, AccountStatus } from "@/types";
import { cn, relativeTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { useAuth } from "@/context/AuthenticationContext";
import { getAccounts } from "@/utils/accountAPI";
import { subscribeToAccountChanges } from "@/utils/socket";
import AccountActionModal, { type AccountAction } from "@/components/accounts/AccountActionModal";
import PromoteAdminModal from "@/components/accounts/PromoteAdminModal";
import AccountAuditLog from "@/components/accounts/AccountAuditLog";
import { ACCOUNT_STATUS, ROLE_BADGE, formatDateTime, parseServerDate } from "@/components/accounts/accountMeta";

type StatusTab = AccountStatus | "all";
const TABS: StatusTab[] = ["pending", "active", "deactivated", "rejected", "all"];

interface AccountsPageProps {
  onPendingCountChange: (count: number) => void;
}

export default function AccountsPage({ onPendingCountChange }: AccountsPageProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<StatusTab | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ account: Account; action: AccountAction } | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<Account | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await getAccounts();
      setAccounts(list);
      onPendingCountChange(list.filter((a) => a.status === "pending").length);
      // Open on the pending tab when registrations are waiting, otherwise on active accounts
      setTab((current) => current ?? (list.some((a) => a.status === "pending") ? "pending" : "active"));
    } catch (err: any) {
      setError(err.message || "Failed to load accounts.");
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    load();
    return subscribeToAccountChanges(() => load());
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<StatusTab, number> = { pending: 0, active: 0, deactivated: 0, rejected: 0, all: accounts.length };
    accounts.forEach((a) => (result[a.status] += 1));
    return result;
  }, [accounts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter(
      (a) =>
        (tab === "all" || a.status === tab) &&
        (!q || a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.contactNumber.toLowerCase().includes(q))
    );
  }, [accounts, tab, query]);

  const selected = accounts.find((a) => a.id === selectedId) || null;

  const applyUpdate = (updated: Account) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      onPendingCountChange(next.filter((a) => a.status === "pending").length);
      return next;
    });
  };

  const actionButtons = (account: Account, size: "sm" | "md") => {
    if (account.id === user?.id) return <span className="text-xs text-slate-400">This is you</span>;
    const base = cn(
      "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg font-semibold transition",
      size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
    );
    const open = (action: AccountAction) => (e: React.MouseEvent) => {
      e.stopPropagation();
      setPendingAction({ account, action });
    };
    switch (account.status) {
      case "pending":
        return (
          <>
            <button type="button" onClick={open("approve")} className={cn(base, "bg-emerald-600 text-white hover:bg-emerald-700")}>
              <Check className="h-3.5 w-3.5" /> Approve
            </button>
            <button type="button" onClick={open("reject")} className={cn(base, "border border-rose-200 text-rose-700 hover:bg-rose-50")}>
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </>
        );
      case "active":
        return (
          <>
            {account.role === "employee" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPromoteTarget(account);
                }}
                className={cn(base, "border border-violet-200 text-violet-700 hover:bg-violet-50")}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Make admin
              </button>
            )}
            <button type="button" onClick={open("deactivate")} className={cn(base, "border border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700")}>
              <Ban className="h-3.5 w-3.5" /> Deactivate
            </button>
          </>
        );
      case "deactivated":
        return (
          <button type="button" onClick={open("reactivate")} className={cn(base, "border border-emerald-200 text-emerald-700 hover:bg-emerald-50")}>
            <RotateCcw className="h-3.5 w-3.5" /> Reactivate
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title="Accounts & Audit Logs"
        subtitle="Approve new registrations, manage employee access, and review each account's activity."
      />

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter accounts by status">
            {TABS.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  tab === key ? "bg-sky-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {key === "all" ? "All accounts" : ACCOUNT_STATUS[key].label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold",
                    tab === key ? "bg-white/25" : key === "pending" && counts.pending > 0 ? "bg-amber-500 text-white" : "bg-white text-slate-500"
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={cn(inputClass, "pl-10")} placeholder="Search name, email, contact..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading accounts...</p>
        ) : error ? (
          <p className="p-10 text-center text-sm text-rose-600">{error}</p>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={tab === "pending" ? Check : Users}
              title={tab === "pending" ? "No registrations waiting" : "No accounts found"}
              subtitle={tab === "pending" ? "New sign-ups will appear here for approval." : "Try a different tab or search."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3">Last sign-in</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((account) => {
                  const lastLogin = parseServerDate(account.lastLoginAt);
                  return (
                    <tr key={account.id} onClick={() => setSelectedId(account.id)} className="cursor-pointer transition hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={account.fullName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {account.fullName}
                              {account.id === user?.id && <span className="ml-1.5 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">YOU</span>}
                            </p>
                            <p className="truncate text-xs text-slate-400">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{account.contactNumber || "—"}</td>
                      <td className="px-5 py-3.5"><Badge config={ROLE_BADGE[account.role]} label={ROLE_BADGE[account.role].label} /></td>
                      <td className="px-5 py-3.5"><Badge config={ACCOUNT_STATUS[account.status]} label={ACCOUNT_STATUS[account.status].label} /></td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{formatDateTime(account.registeredAt)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">{lastLogin ? relativeTime(lastLogin) : "Never"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {actionButtons(account, "sm")}
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Account detail drawer with that account's own audit log */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelectedId(null)} />
          <aside className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl" aria-label={`${selected.fullName} account details`}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <Avatar name={selected.fullName} size="lg" />
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{selected.fullName}</h2>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge config={ROLE_BADGE[selected.role]} label={ROLE_BADGE[selected.role].label} />
                    <Badge config={ACCOUNT_STATUS[selected.status]} label={ACCOUNT_STATUS[selected.status].label} />
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm sm:grid-cols-3">
                {[
                  ["Contact number", selected.contactNumber || "—"],
                  ["Registered", formatDateTime(selected.registeredAt)],
                  ["Last sign-in", formatDateTime(selected.lastLoginAt)],
                  ["Approved", selected.approvedAt ? `${formatDateTime(selected.approvedAt)}${selected.approvedBy ? ` by ${selected.approvedBy}` : ""}` : "—"],
                  ["Last status change", selected.statusChangedAt ? `${formatDateTime(selected.statusChangedAt)}${selected.statusChangedBy ? ` by ${selected.statusChangedBy}` : ""}` : "—"],
                  ["Logged actions", String(selected.auditCount)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 text-slate-800">{value}</dd>
                  </div>
                ))}
                {selected.statusReason && (
                  <div className="col-span-full">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {selected.status === "rejected" ? "Rejection reason" : "Reason"}
                    </dt>
                    <dd className="mt-0.5 text-slate-800">{selected.statusReason}</dd>
                  </div>
                )}
              </dl>

              {selected.id !== user?.id && selected.status !== "rejected" && (
                <div className="flex flex-wrap items-center gap-2">{actionButtons(selected, "md")}</div>
              )}

              <AccountAuditLog key={selected.id} account={selected} />
            </div>
          </aside>
        </div>
      )}

      <AccountActionModal
        account={pendingAction?.account ?? null}
        action={pendingAction?.action ?? null}
        onClose={() => setPendingAction(null)}
        onDone={applyUpdate}
      />
      <PromoteAdminModal account={promoteTarget} onClose={() => setPromoteTarget(null)} onDone={applyUpdate} />

      {!loading && accounts.length > 0 && counts.pending === 0 && tab === "pending" && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <UserCog className="h-3.5 w-3.5" />
          Employees register from the sign-in page using "Create an account".
        </p>
      )}
    </div>
  );
}
