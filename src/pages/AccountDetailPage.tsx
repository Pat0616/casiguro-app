import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Mail, Phone } from "lucide-react";
import type { Account, AccountDetail, AuditCategory } from "@/types";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { useAuth } from "@/context/AuthenticationContext";
import { getAccount } from "@/utils/accountAPI";
import { subscribeToAccountChanges } from "@/utils/socket";
import AccountActions from "@/components/accounts/AccountActions";
import AccountActionModal, { type AccountAction } from "@/components/accounts/AccountActionModal";
import PromoteAdminModal from "@/components/accounts/PromoteAdminModal";
import AccountAuditLog from "@/components/accounts/AccountAuditLog";
import { ACCOUNT_STATUS, AUDIT_CATEGORY, ROLE_BADGE, formatDateTime } from "@/components/accounts/accountMeta";

const SUMMARY_ORDER: AuditCategory[] = ["auth", "order", "payment", "quotation", "catalog", "account"];

export default function AccountDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<AuditCategory | "all">("all");
  const [pendingAction, setPendingAction] = useState<AccountAction | null>(null);
  const [promoting, setPromoting] = useState(false);
  // Bumped after an action so the activity log reloads (the acting admin's own log gains an entry)
  const [logVersion, setLogVersion] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      setAccount(await getAccount(id));
    } catch (err: any) {
      setError(err.message || "Failed to load this account.");
    }
  }, [id]);

  useEffect(() => {
    load();
    return subscribeToAccountChanges(({ userId }) => {
      if (userId === id) load();
    });
  }, [id, load]);

  const handleUpdated = (_updated: Account) => {
    load();
    setLogVersion((v) => v + 1);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card className="p-10 text-center text-sm text-rose-600">{error}</Card>
      </div>
    );
  }
  if (!account) return <p className="p-10 text-center text-sm text-slate-500">Loading account...</p>;

  const summary = account.activitySummary;
  const isSelf = account.id === user?.id;

  return (
    <div className="space-y-5">
      <BackLink />

      {/* Profile header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={account.fullName} size="lg" />
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold text-slate-900">
                {account.fullName}
                {isSelf && <span className="ml-2 rounded bg-sky-50 px-1.5 py-0.5 align-middle text-[11px] font-bold text-sky-700">YOU</span>}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{account.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{account.contactNumber || "No contact number"}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge config={ROLE_BADGE[account.role]} label={ROLE_BADGE[account.role].label} />
                <Badge config={ACCOUNT_STATUS[account.status]} label={ACCOUNT_STATUS[account.status].label} />
              </div>
            </div>
          </div>
          {account.status !== "rejected" && (
            <div className="flex flex-wrap items-center gap-2">
              <AccountActions
                account={account}
                currentUserId={user?.id}
                size="md"
                onAction={setPendingAction}
                onPromote={() => setPromoting(true)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Account facts + activity summary side by side, so the activity log below gets the full page width */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Account details</h3>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Registered", formatDateTime(account.registeredAt)],
              ["Approved", account.approvedAt ? `${formatDateTime(account.approvedAt)}${account.approvedBy ? ` · by ${account.approvedBy}` : ""}` : "—"],
              ["Last status change", account.statusChangedAt ? `${formatDateTime(account.statusChangedAt)}${account.statusChangedBy ? ` · by ${account.statusChangedBy}` : ""}` : "—"],
              ["Last sign-in", formatDateTime(account.lastLoginAt)],
              ["Last activity", formatDateTime(summary.lastActivityAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-0.5 text-slate-800">{value}</dd>
              </div>
            ))}
            {account.statusReason && (
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {account.status === "rejected" ? "Rejection reason" : "Reason"}
                </dt>
                <dd className="mt-0.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-800">{account.statusReason}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Activity summary</h3>
            <span className="text-xs text-slate-500">{account.auditCount} total</span>
          </div>
          {summary.failedLogins30d > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {summary.failedLogins30d} failed sign-in attempt{summary.failedLogins30d === 1 ? "" : "s"} in the last 30 days
            </div>
          )}
          <ul className="grid gap-1 sm:grid-cols-2">
            {SUMMARY_ORDER.map((key) => {
              const meta = AUDIT_CATEGORY[key];
              const Icon = meta.icon;
              const total = summary.byCategory[key] || 0;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setCategory(category === key ? "all" : key)}
                    aria-pressed={category === key}
                    title={`Show only ${meta.label.toLowerCase()} in the activity log`}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition",
                      category === key ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", meta.tint)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-slate-700">{meta.label}</span>
                    </span>
                    <span className={cn("font-mono text-sm font-bold", total ? "text-slate-900" : "text-slate-300")}>{total}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <AccountAuditLog key={`${account.id}-${logVersion}`} account={account} category={category} onCategoryChange={setCategory} />

      <AccountActionModal account={pendingAction ? account : null} action={pendingAction} onClose={() => setPendingAction(null)} onDone={handleUpdated} />
      <PromoteAdminModal account={promoting ? account : null} onClose={() => setPromoting(false)} onDone={handleUpdated} />
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/accounts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-sky-700">
      <ArrowLeft className="h-4 w-4" />
      Back to accounts
    </Link>
  );
}
