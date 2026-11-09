// casiguro-app/src/components/orders/DeadlineModal.tsx
// Changes an open order's deadline (any employee). Saves immediately; the server records a notification and an
// audit entry with the reason. Rules (also enforced by the server): today or later, not before the order date.
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CalendarClock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { cn, formatDate, todayKey } from "@/lib/utils";
import { updateOrderDueDate } from "@/utils/orderAPI";
import type { Order } from "@/types";

interface DeadlineModalProps {
  order: Order | null;
  onClose: () => void;
  onSaved: (order: Order) => void;
}

export default function DeadlineModal({ order, onClose, onSaved }: DeadlineModalProps) {
  const [dueDate, setDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDueDate(order?.dueDate || "");
    setReason("");
    setError(null);
  }, [order?.id]);

  if (!order) return null;

  const today = todayKey();
  const minDate = order.dateOrdered && order.dateOrdered > today ? order.dateOrdered : today;
  const changed = Boolean(dueDate) && dueDate !== order.dueDate;

  const handleSave = async () => {
    if (!dueDate) return setError("Choose the new deadline.");
    if (dueDate < minDate) {
      return setError(dueDate < today ? "The new deadline can't be in the past." : "The new deadline can't be before the order date.");
    }
    if (!changed) return setError("That is already the deadline.");
    if (!reason.trim()) return setError("Please enter the reason for the change.");
    try {
      setSaving(true);
      setError(null);
      const saved = await updateOrderDueDate(order.id, { dueDate, reason: reason.trim() });
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change the deadline.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={saving ? () => undefined : onClose} title="Change deadline" subtitle={`SOA ${order.soaNo} · ${order.customerName}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <CalendarClock className="h-5 w-5 text-slate-400" />
          <span className="text-slate-500">Current</span>
          <strong className={cn("text-slate-900", changed && "text-slate-400 line-through")}>{formatDate(order.dueDate)}</strong>
          {changed && (
            <>
              <ArrowRight className="h-4 w-4 text-sky-500" />
              <strong className="text-sky-700">{formatDate(dueDate)}</strong>
            </>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">New deadline</span>
          <input
            type="date"
            min={minDate}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Reason (required, shown in notifications and the activity log)
          </span>
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer asked for a later pickup, material delivery delayed"
            className={inputClass}
          />
        </label>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Back</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save new deadline"}</Button>
        </div>
      </div>
    </Modal>
  );
}
