// casiguro-app/src/components/orders/PaymentsPanel.tsx
// Payment log of one order: totals, every entry (voided ones struck through), a form to record a payment,
// and (admins) voiding. Each action is saved immediately and returns the updated order.
import { useState } from "react";
import { AlertCircle, Ban, DollarSign, Plus } from "lucide-react";
import { cn, formatCurrency, formatDocDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from "@/lib/constants";
import type { Order, Payment } from "@/types";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthenticationContext";
import { recordPayment, voidPayment } from "@/utils/orderAPI";
import PaymentFields, { EMPTY_PAYMENT_FORM, toPaymentInput, type PaymentForm } from "@/components/orders/PaymentFields";
import ReasonModal from "@/components/orders/ReasonModal";

interface PaymentsPanelProps {
  order: Order;
  onOrderChange: (order: Order) => void;
}

function paymentDetails(p: Payment) {
  const parts = [
    p.method ? PAYMENT_METHOD_LABELS[p.method] : p.paymentType === "ewt" ? null : "Method not recorded",
    p.referenceNo ? `${p.method === "check" ? "Check" : p.paymentType === "ewt" ? "2307" : "Ref"} ${p.referenceNo}` : null,
    p.checkBank,
    p.checkDate ? `dated ${formatDocDate(p.checkDate)}` : null,
    p.orNo ? `OR ${p.orNo}` : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export default function PaymentsPanel({ order, onOrderChange }: PaymentsPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaymentForm>(EMPTY_PAYMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toVoid, setToVoid] = useState<Payment | null>(null);

  const payments = order.payments || [];
  const cancelled = order.status === "cancelled";
  const ewtTotal = payments.filter((p) => !p.voidedAt && p.paymentType === "ewt").reduce((s, p) => s + p.amount, 0);

  const openForm = () => {
    // The first payment on an order still in production is usually its down payment
    const firstPayment = payments.every((p) => p.voidedAt) && order.status !== "completed";
    setForm({ ...EMPTY_PAYMENT_FORM, paymentType: firstPayment ? "down_payment" : "payment" });
    setError(null);
    setShowForm(true);
  };

  const handleRecord = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return setError("Enter an amount greater than 0.");
    if (amount > order.balance + 0.001) return setError(`Amount is more than the remaining balance of ${formatCurrency(order.balance)}.`);
    try {
      setSaving(true);
      setError(null);
      onOrderChange(await recordPayment(order.id, toPaymentInput(form)));
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          Payments
        </h4>
        {!cancelled && order.balance > 0 && !showForm && (
          <Button size="sm" onClick={openForm}>
            <Plus className="h-3.5 w-3.5" /> Record payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Order Value</span>
          <span className="font-mono font-extrabold text-base text-slate-900">{formatCurrency(order.totalPrice)}</span>
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount Paid</span>
          <span className="font-mono font-extrabold text-base text-emerald-700">{formatCurrency(order.amountPaid)}</span>
          {ewtTotal > 0 && <span className="block text-[10px] text-slate-500">incl. {formatCurrency(ewtTotal)} EWT</span>}
        </div>
        <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Balance</span>
          <span className={cn("font-mono font-extrabold text-base", order.balance > 0 ? "text-rose-600" : "text-slate-900")}>
            {formatCurrency(order.balance)}
          </span>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-xs text-slate-500">No payments recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {payments.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-xs">
              <div className={cn("min-w-0", p.voidedAt && "opacity-60")}>
                <p className="font-semibold text-slate-800">
                  <span className={cn(p.voidedAt && "line-through")}>
                    {PAYMENT_TYPE_LABELS[p.paymentType]} · {formatCurrency(p.amount)}
                  </span>
                  <span className="ml-2 font-normal text-slate-500">{formatDocDate(p.receivedOn)}</span>
                </p>
                <p className="text-slate-500">{paymentDetails(p) || "—"}</p>
                {p.note && <p className="text-slate-500 italic">{p.note}</p>}
                <p className="text-[10px] text-slate-400">Recorded by {p.createdByName || "—"}</p>
                {p.voidedAt && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    Voided by {p.voidedByName || "—"}: {p.voidReason}
                  </p>
                )}
              </div>
              {isAdmin && !p.voidedAt && (
                <button
                  type="button"
                  onClick={() => setToVoid(p)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-rose-300 hover:text-rose-600"
                  title="Void this payment"
                >
                  <Ban className="h-3 w-3" /> Void
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="space-y-3 rounded-xl border border-sky-200 bg-white p-4">
          <PaymentFields value={form} onChange={setForm} maxAmount={order.balance} />
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">Saved immediately. Mistakes can only be voided by an admin.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button size="sm" onClick={handleRecord} disabled={saving}>{saving ? "Saving..." : "Save payment"}</Button>
            </div>
          </div>
        </div>
      )}

      <ReasonModal
        open={!!toVoid}
        title="Void payment"
        subtitle={toVoid ? `${PAYMENT_TYPE_LABELS[toVoid.paymentType]} · ${formatCurrency(toVoid.amount)}` : undefined}
        body="The entry stays on record, marked voided, and no longer counts toward the amount paid. Use this for entries recorded by mistake or money that was refunded."
        confirmLabel="Void payment"
        onConfirm={async (reason) => onOrderChange(await voidPayment(order.id, toVoid!.id, reason))}
        onClose={() => setToVoid(null)}
      />
    </div>
  );
}
