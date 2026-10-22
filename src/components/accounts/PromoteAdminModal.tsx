import { useEffect, useState } from "react";
import { AlertCircle, Check, ShieldAlert } from "lucide-react";
import type { Account } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { PROMOTE_CONFIRMATION_PHRASE, promoteAccount } from "@/utils/accountAPI";

const ADMIN_POWERS = [
  "Approve, reject, deactivate and reactivate accounts",
  "Promote other employees to admin",
  "View every account's audit log",
  "Manage the product & service catalog and prices",
  "See the dashboard and business statistics",
];

const STEPS = ["Review", "Confirm", "Verify"];

interface PromoteAdminModalProps {
  account: Account | null;
  onClose: () => void;
  onDone: (updated: Account) => void;
}

// Three deliberate steps: acknowledge what admin access means, type the phrase by hand, re-enter your own password.
// The server checks the phrase and password again, and logs failed attempts.
export default function PromoteAdminModal({ account, onClose, onDone }: PromoteAdminModalProps) {
  const [step, setStep] = useState(0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStep(0);
    setAcknowledged(false);
    setPhrase("");
    setPassword("");
    setError(null);
  }, [account?.id]);

  if (!account) return null;
  const phraseMatches = phrase === PROMOTE_CONFIRMATION_PHRASE;

  const handlePromote = async () => {
    try {
      setSaving(true);
      setError(null);
      onDone(await promoteAccount(account.id, phrase, password));
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not promote the account.");
      setPassword("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title="Promote to admin" subtitle={`${account.fullName} · ${account.email}`}>
      <div className="space-y-5">
        <ol className="flex items-center gap-2">
          {STEPS.map((label, index) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  index < step ? "bg-emerald-500 text-white" : index === step ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-400"
                )}
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={cn("text-xs font-semibold", index === step ? "text-slate-900" : "text-slate-400")}>{label}</span>
              {index < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <ShieldAlert className="h-5 w-5 shrink-0 text-violet-600" />
              <div className="text-sm text-violet-900">
                <p className="font-semibold">{account.fullName} will get full administrator access.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-violet-800">
                  {ADMIN_POWERS.map((power) => <li key={power}>{power}</li>)}
                </ul>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 accent-violet-600" />
              I understand that this gives {account.fullName} the same access as me, and that this action is recorded in my audit log.
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Type the following phrase exactly as shown (it's case-sensitive):</p>
            <p className="select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-sm font-semibold text-slate-900">
              {PROMOTE_CONFIRMATION_PHRASE}
            </p>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type the phrase here"
              aria-label="Confirmation phrase"
              className={cn(inputClass, "font-mono", phrase && (phraseMatches ? "border-emerald-400" : "border-amber-300"))}
            />
            <p className={cn("text-xs", phraseMatches ? "text-emerald-600" : "text-slate-400")}>
              {phraseMatches ? "Phrase matches." : "Pasting is disabled. Please type it out."}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">For security, enter <span className="font-semibold">your own</span> password to confirm it's you.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Your password"
              aria-label="Your password"
              className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && password && !saving && handlePromote()}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-between gap-3 border-t border-slate-100 pt-4">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)} disabled={saving}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 ? !acknowledged : !phraseMatches}>
              Continue
            </Button>
          ) : (
            <Button onClick={handlePromote} disabled={!password || saving} className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800">
              {saving ? "Promoting..." : "Promote to admin"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
