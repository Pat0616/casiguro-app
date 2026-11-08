import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Field, { inputClass } from "@/components/ui/Field";
import { changePassword } from "@/utils/authAPI";

// Same rule as the server (backend/utils/accountFields.js#validatePassword)
const PASSWORD_ERROR = "Password must be at least 8 characters and include a letter and a number.";
const isStrongEnough = (pw: string) => pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

// The signed-in user's own password. Saving signs out their other sessions; this one stays signed in.
export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrent("");
    setNext("");
    setConfirm("");
    setShow(false);
    setError(null);
    setDone(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!isStrongEnough(next)) return setError(PASSWORD_ERROR);
    if (next !== confirm) return setError("New passwords don't match.");
    if (next === current) return setError("Choose a password different from your current one.");
    try {
      setSaving(true);
      const res = await changePassword(current, next);
      setDone(res.message);
    } catch (err: any) {
      setError(err.message || "Couldn't change the password.");
    } finally {
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <Modal open={open} onClose={saving ? () => undefined : onClose} title="Change password" subtitle="Your own account">
      {done ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {done}
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Field label="Current password">
            <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={inputClass} autoFocus />
          </Field>
          <Field label="New password">
            <input type={type} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" className={inputClass} />
          </Field>
          <Field label="Confirm new password">
            <input type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={inputClass} />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Use 8+ characters with a letter and a number. Other devices will be signed out.</p>
            <button type="button" onClick={() => setShow((v) => !v)} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-sky-600">
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !current || !next || !confirm}>
              {saving ? "Saving..." : "Change password"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
