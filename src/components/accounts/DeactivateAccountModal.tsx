import { useEffect, useState } from "react";
import { AlertCircle, Check, ShieldAlert } from "lucide-react";
import type { Account } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { deactivateAccount } from "@/utils/accountAPI";

const ADMIN_STEPS = ["Review", "Confirm", "Verify"];

interface DeactivateAccountModalProps {
  account: Account | null;
  onClose: () => void;
  onDone: (updated: Account) => void;
}

// Deactivation always needs a reason and the acting admin's own password. For an admin target there are three
// deliberate steps (acknowledge, type their email, verify). The server re-checks everything and logs failed attempts.
export default function DeactivateAccountModal({ account, onClose, onDone }: DeactivateAccountModalProps) {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStep(0);
    setAcknowledged(false);
    setEmail("");
    setReason("");
    setPassword("");
    setError(null);
  }, [account?.id]);

  if (!account) return null;
  const isAdmin = account.role === "admin";
  const emailMatches = email.trim().toLowerCase() === account.email.toLowerCase();
  const onVerifyStep = !isAdmin || step === 2;
  const canSubmit = reason.trim().length > 0 && password.length > 0 && !saving;

  const handleDeactivate = async () => {
    try {
      setSaving(true);
      setError(null);
      onDone(await deactivateAccount(account.id, { reason: reason.trim(), password, confirmEmail: isAdmin ? email.trim() : undefined }));
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not deactivate the account.");
      setPassword("");
    } finally {
      setSaving(false);
    }
  };

  const consequences = (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-rose-800">
      <li>{account.fullName} is signed out immediately and can't sign in.</li>
      <li>Their records and audit log are kept.</li>
      <li>Any admin can reactivate the account later.</li>
      {isAdmin && <li>They'll get an email saying you deactivated it, when, and why.</li>}
    </ul>
  );

  return (
    <Modal
      open
      onClose={saving ? () => undefined : onClose}
      title={isAdmin ? "Deactivate admin account" : "Deactivate account"}
      subtitle={`${account.fullName} · ${account.email}`}
    >
      <div className="space-y-5">
        {isAdmin && (
          <ol className="flex items-center gap-2">
            {ADMIN_STEPS.map((label, index) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    index < step ? "bg-emerald-500 text-white" : index === step ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className={cn("text-xs font-semibold", index === step ? "text-slate-900" : "text-slate-400")}>{label}</span>
                {index < ADMIN_STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
              </li>
            ))}
          </ol>
        )}

        {isAdmin && step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
              <div className="text-sm text-rose-900">
                <p className="font-semibold">You're about to deactivate an administrator.</p>
                {consequences}
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 accent-rose-600" />
              I understand that this locks {account.fullName} out of an admin account, and that this action is recorded in my audit log.
            </label>
          </div>
        )}

        {isAdmin && step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Type this admin's email address to confirm you have the right account:</p>
            <p className="select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold text-slate-900">
              {account.email}
            </p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type the email here"
              aria-label="Admin's email"
              className={cn(inputClass, "font-mono", email && (emailMatches ? "border-emerald-400" : "border-amber-300"))}
            />
            <p className={cn("text-xs", emailMatches ? "text-emerald-600" : "text-slate-400")}>
              {emailMatches ? "Email matches." : "Pasting is disabled. Please type it out."}
            </p>
          </div>
        )}

        {onVerifyStep && (
          <div className="space-y-3">
            {!isAdmin && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-semibold">Deactivate this employee account?</p>
                {consequences}
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Reason (required, saved with the account and the audit log)</span>
              <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                Your password (to confirm it's you)
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                className={inputClass}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleDeactivate()}
              />
            </label>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={!isAdmin || step === 0 ? onClose : () => setStep((s) => s - 1)} disabled={saving}>
            {!isAdmin || step === 0 ? "Cancel" : "Back"}
          </Button>
          {onVerifyStep ? (
            <Button variant="danger" onClick={handleDeactivate} disabled={!canSubmit}>
              {saving ? "Deactivating..." : isAdmin ? "Deactivate admin" : "Deactivate account"}
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !acknowledged : !emailMatches}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
