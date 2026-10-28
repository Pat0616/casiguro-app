import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Account } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { approveAccount, reactivateAccount, rejectAccount } from "@/utils/accountAPI";
import DeactivateAccountModal from "./DeactivateAccountModal";

export type AccountAction = "approve" | "reject" | "deactivate" | "reactivate";

// Deactivate has its own stricter window (password, and the email for admins)
const ACTIONS: Record<
  Exclude<AccountAction, "deactivate">,
  {
    title: string;
    confirmLabel: string;
    variant: "primary" | "danger";
    withReason: boolean;
    body: (a: Account) => string;
    run: (a: Account, reason: string) => Promise<Account>;
  }
> = {
  approve: {
    title: "Approve registration",
    confirmLabel: "Approve account",
    variant: "primary",
    withReason: false,
    body: (a) => `${a.fullName} (${a.email}) will be able to sign in as an employee right away.`,
    run: (a) => approveAccount(a.id),
  },
  reject: {
    title: "Reject registration",
    confirmLabel: "Reject registration",
    variant: "danger",
    withReason: true,
    body: (a) => `${a.fullName} (${a.email}) won't be able to sign in. The registration is kept on record as rejected.`,
    run: (a, reason) => rejectAccount(a.id, reason),
  },
  reactivate: {
    title: "Reactivate account",
    confirmLabel: "Reactivate account",
    variant: "primary",
    withReason: false,
    body: (a) => `${a.fullName} will be able to sign in again as ${a.role === "admin" ? "an admin" : "an employee"}.`,
    run: (a) => reactivateAccount(a.id),
  },
};

interface AccountActionModalProps {
  account: Account | null;
  action: AccountAction | null;
  onClose: () => void;
  onDone: (updated: Account) => void;
}

export default function AccountActionModal({ account, action, onClose, onDone }: AccountActionModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason("");
    setError(null);
  }, [account?.id, action]);

  if (!account || !action) return null;
  if (action === "deactivate") return <DeactivateAccountModal account={account} onClose={onClose} onDone={onDone} />;
  const config = ACTIONS[action];

  const handleConfirm = async () => {
    try {
      setSaving(true);
      setError(null);
      onDone(await config.run(account, reason.trim()));
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={config.title} subtitle={account.fullName}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{config.body(account)}</p>
        {config.withReason && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Reason (optional, saved with the account and the audit log)</span>
            <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
          </label>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant={config.variant} onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving..." : config.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
