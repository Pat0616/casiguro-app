import { Ban, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import type { Account } from "@/types";
import { cn } from "@/lib/utils";
import type { AccountAction } from "./AccountActionModal";

interface AccountActionsProps {
  account: Account;
  currentUserId?: string;
  size?: "sm" | "md";
  onAction: (action: AccountAction) => void;
  onPromote: () => void;
}

// The actions available for an account depend on its status; nobody can act on their own account
export default function AccountActions({ account, currentUserId, size = "sm", onAction, onPromote }: AccountActionsProps) {
  if (account.id === currentUserId) return <span className="text-xs text-slate-400">This is you</span>;

  const base = cn(
    "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg font-semibold transition",
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
  );
  // Stop the click from also triggering the table row's navigation
  const handle = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  switch (account.status) {
    case "pending":
      return (
        <>
          <button type="button" onClick={handle(() => onAction("approve"))} className={cn(base, "bg-emerald-600 text-white hover:bg-emerald-700")}>
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button type="button" onClick={handle(() => onAction("reject"))} className={cn(base, "border border-rose-200 text-rose-700 hover:bg-rose-50")}>
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </>
      );
    case "active":
      return (
        <>
          {account.role === "employee" && (
            <button type="button" onClick={handle(onPromote)} className={cn(base, "border border-violet-200 text-violet-700 hover:bg-violet-50")}>
              <ShieldCheck className="h-3.5 w-3.5" /> Make admin
            </button>
          )}
          <button
            type="button"
            onClick={handle(() => onAction("deactivate"))}
            className={cn(base, "border border-slate-200 text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700")}
          >
            <Ban className="h-3.5 w-3.5" /> Deactivate
          </button>
        </>
      );
    case "deactivated":
      return (
        <button type="button" onClick={handle(() => onAction("reactivate"))} className={cn(base, "border border-emerald-200 text-emerald-700 hover:bg-emerald-50")}>
          <RotateCcw className="h-3.5 w-3.5" /> Reactivate
        </button>
      );
    default:
      return null;
  }
}
