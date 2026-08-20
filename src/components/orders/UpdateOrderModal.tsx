import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
  const [unitPrice, setUnitPrice] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [quantityCompleted, setQuantityCompleted] = useState(0);
  const [status, setStatus] = useState<OrderStatus>("pending");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusKey>("unpaid");

  useEffect(() => {
    if (order) {
      setUnitPrice(order.unitPrice);
      setAmountPaid(order.amountPaid);
      setQuantity(order.quantity);
      setQuantityCompleted(order.quantityCompleted);
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
    }
  }, [order]);

  if (!order) return null;
  const total = Number(quantity || 0) * Number(unitPrice || 0);
  const progress = quantity > 0 ? Math.min(100, Math.round((quantityCompleted / quantity) * 100)) : 0;

  const handleQtyCompleted = (val: string) => {
    const n = Math.max(0, Math.min(Number(val) || 0, Number(quantity) || 0));
    setQuantityCompleted(n);
  };
  const handleQtyRequired = (val: string) => {
    const n = Math.max(1, Number(val) || 1);
    setQuantity(n);
    if (quantityCompleted > n) setQuantityCompleted(n);
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
            <input type="number" min="0" step="0.01" className={inputClass} value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} />
          </Field>
          <Field label="Total Price (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>{formatCurrency(total)}</div>
          </Field>
          <Field label="Amount Paid">
            <input type="number" min="0" step="0.01" className={inputClass} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
          </Field>
          <Field label="Remaining Balance (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>{formatCurrency(Math.max(total - Number(amountPaid || 0), 0))}</div>
          </Field>
          <Field label="Quantity Required">
            <input type="number" min="1" className={inputClass} value={quantity} onChange={(e) => handleQtyRequired(e.target.value)} />
          </Field>
          <Field label="Quantity Completed">
            <input type="number" min="0" className={inputClass} value={quantityCompleted} onChange={(e) => handleQtyCompleted(e.target.value)} />
          </Field>
          <Field label="Order Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready for Pickup</option>
              <option value="completed">Complete</option>
            </select>
          </Field>
          <Field label="Payment Status">
            <select className={inputClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusKey)}>
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
              onSave(order.id, { unitPrice, amountPaid, quantity, quantityCompleted, status, paymentStatus })
            }
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
