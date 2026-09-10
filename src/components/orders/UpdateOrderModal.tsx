import { useEffect, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";
import type { Order, OrderStatus, OrderUpdatePayload, PaymentStatusKey } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface UpdateOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (id: string, changes: OrderUpdatePayload) => void;
}

export default function UpdateOrderModal({ order, onClose, onSave }: UpdateOrderModalProps) {
  const [unitPrice, setUnitPrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityCompleted, setQuantityCompleted] = useState("");
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusKey>("unpaid");
  const [showPaidAddition, setShowPaidAddition] = useState(false);
  const [showQuantityAddition, setShowQuantityAddition] = useState(false);
  const [paidAddition, setPaidAddition] = useState("");
  const [quantityAddition, setQuantityAddition] = useState("");

  useEffect(() => {
    if (order) {
      setUnitPrice(String(order.unitPrice));
      setAmountPaid(String(order.amountPaid));
      setQuantity(String(order.quantity));
      setQuantityCompleted(String(order.quantityCompleted));
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      setShowPaidAddition(false);
      setShowQuantityAddition(false);
      setPaidAddition("");
      setQuantityAddition("");
    }
  }, [order]);

  if (!order) return null;
  const numericUnitPrice = Number(unitPrice) || 0;
  const numericAmountPaid = Number(amountPaid) || 0;
  const numericQuantity = Number(quantity) || 0;
  const numericQuantityCompleted = Number(quantityCompleted) || 0;
  const total = numericQuantity * numericUnitPrice;
  const progress = numericQuantity > 0 ? Math.min(100, Math.round((numericQuantityCompleted / numericQuantity) * 100)) : 0;

  const handleQtyCompleted = (val: string) => {
    const n = Math.max(0, Math.min(Number(val) || 0, numericQuantity));
    setQuantityCompleted(val === "" ? "" : String(n));
    if (n > 0 && n < numericQuantity) setStatus("in_production");
    if (n === 0 && status === "in_production") setStatus("pending");
  };
  const handleQtyRequired = (val: string) => {
    if (val === "") {
      setQuantity("");
      return;
    }
    const n = Math.max(1, Number(val) || 1);
    setQuantity(String(n));
    if (numericQuantityCompleted > n) setQuantityCompleted(String(n));
    if (numericQuantityCompleted > 0 && numericQuantityCompleted < n) setStatus("in_production");
  };

  const handleAmountPaid = (val: string) => {
    const n = Math.max(0, Math.min(Number(val) || 0, total));
    setAmountPaid(val === "" ? "" : String(n));
    if (n === 0) setPaymentStatus("unpaid");
    else if (n < total) setPaymentStatus("partial");
    else setPaymentStatus("paid");
  };

  const applyPaidAddition = () => {
    const addition = Math.max(0, Number(paidAddition) || 0);
    const cappedAddition = Math.min(addition, Math.max(total - numericAmountPaid, 0));
    setPaidAddition(String(cappedAddition));
    handleAmountPaid(String(numericAmountPaid + cappedAddition));
  };

  const applyQuantityAddition = () => {
    const addition = Math.max(0, Number(quantityAddition) || 0);
    const cappedAddition = Math.min(addition, Math.max(numericQuantity - numericQuantityCompleted, 0));
    setQuantityAddition(String(cappedAddition));
    const nextQuantityCompleted = numericQuantityCompleted + cappedAddition;
    setQuantityCompleted(String(nextQuantityCompleted));
    if (nextQuantityCompleted > 0 && nextQuantityCompleted < numericQuantity) {
      setStatus("in_production");
    } else if (nextQuantityCompleted >= numericQuantity) {
      setStatus("ready");
    }
  };

  return (
    <Modal open={!!order} onClose={onClose} title={`Update Order · ${order.refNo}`} subtitle={`${order.customerName} — ${order.product}`} wide>
      <div className="space-y-6">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Production Progress</span>
            <span>{quantityCompleted} / {quantity} pcs · {progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={cn(GRADIENT, "h-full rounded-full transition-all")} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Unit Price">
            <input type="number" min="0" step="0.01" className={inputClass} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          </Field>
          <Field label="Total Price (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>{formatCurrency(total)}</div>
          </Field>
          <Field label="Amount Paid">
            <div className="relative">
              <input
                type="number"
                min="0"
                max={total}
                step="0.01"
                className={cn(inputClass, "pr-11")}
                value={amountPaid}
                onChange={(e) => handleAmountPaid(e.target.value)}
              />
              <button
                type="button"
                aria-label="Add payment"
                title="Add payment"
                onClick={() => setShowPaidAddition((visible) => !visible)}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showPaidAddition && (
              <input
                type="number"
                min="0"
                max={Math.max(total - numericAmountPaid, 0)}
                step="0.01"
                className={cn(inputClass, "mt-2")}
                value={paidAddition}
                onChange={(e) => setPaidAddition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyPaidAddition();
                    setShowPaidAddition(false);
                  }
                }}
                placeholder={`Add up to ${formatCurrency(Math.max(total - numericAmountPaid, 0))}`}
                autoFocus
              />
            )}
          </Field>
          <Field label="Remaining Balance (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>{formatCurrency(Math.max(total - numericAmountPaid, 0))}</div>
          </Field>
          <Field label="Quantity Required">
            <input type="number" min="1" className={inputClass} value={quantity} onChange={(e) => handleQtyRequired(e.target.value)} />
          </Field>
          <Field label="Quantity Completed">
            <div className="relative">
              <input
                type="number"
                min="0"
                max={numericQuantity}
                className={cn(inputClass, "pr-11")}
                value={quantityCompleted}
                onChange={(e) => handleQtyCompleted(e.target.value)}
              />
              <button
                type="button"
                aria-label="Add completed quantity"
                title="Add completed quantity"
                onClick={() => setShowQuantityAddition((visible) => !visible)}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-pink-50 hover:text-pink-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {showQuantityAddition && (
              <input
                type="number"
                min="0"
                max={Math.max(numericQuantity - numericQuantityCompleted, 0)}
                className={cn(inputClass, "mt-2")}
                value={quantityAddition}
                onChange={(e) => setQuantityAddition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyQuantityAddition();
                    setShowQuantityAddition(false);
                  }
                }}
                placeholder={`Add up to ${Math.max(numericQuantity - numericQuantityCompleted, 0)} pcs`}
                autoFocus
              />
            )}
          </Field>
          <Field label="Order Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => {
                const nextStatus = e.target.value as OrderStatus;
                setStatus(nextStatus);
                if (nextStatus === "ready" || nextStatus === "completed") {
                  setQuantityCompleted(String(numericQuantity));
                }
                if (nextStatus === "completed") {
                  setAmountPaid(String(total));
                  setPaymentStatus("paid");
                }
              }}
            >
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready for Pickup</option>
              <option value="completed">Complete</option>
            </select>
          </Field>
          <Field label="Payment Status">
            <select
              className={inputClass}
              value={paymentStatus}
              onChange={(e) => {
                const nextPaymentStatus = e.target.value as PaymentStatusKey;
                setPaymentStatus(nextPaymentStatus);
                if (nextPaymentStatus === "paid") setAmountPaid(String(total));
              }}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
          </Field>
        </div>

        {status === "completed" && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Saving will mark this order Complete and move it to Completed Transactions.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave(order.id, {
                unitPrice: numericUnitPrice,
                amountPaid: numericAmountPaid,
                quantity: numericQuantity,
                quantityCompleted: numericQuantityCompleted,
                status,
                paymentStatus,
              })
            }
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
