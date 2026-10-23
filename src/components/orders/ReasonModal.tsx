// casiguro-app/src/components/orders/ReasonModal.tsx
// Confirmation that requires a written reason (voiding a payment, cancelling an order). The reason is saved
// on the record and in the audit log.
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

interface ReasonModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  body: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function ReasonModal({ open, title, subtitle, body, confirmLabel, onConfirm, onClose }: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReason("");
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please enter a reason.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{body}</p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Reason (required, saved with the record and the audit log)</span>
          <textarea rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </label>
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Back</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
