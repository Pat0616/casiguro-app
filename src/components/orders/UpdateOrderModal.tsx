// casiguro-app/src/components/orders/UpdateOrderModal.tsx
import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Boxes, Briefcase, AlertCircle, DollarSign } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";
import type { Order, OrderItem, OrderStatus, OrderUpdatePayload, PaymentStatusKey } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { updateItemProduction, recordPayment } from "@/utils/orderAPI";

interface UpdateOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (id: string, changes: OrderUpdatePayload) => void;
}

export default function UpdateOrderModal({ order, onClose, onSave }: UpdateOrderModalProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusKey>("unpaid");
  const [showPaidAddition, setShowPaidAddition] = useState(false);
  const [paidAddition, setPaidAddition] = useState("");
  const [markCompleteDespiteBalance, setMarkCompleteDespiteBalance] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setItems(order.items && order.items.length > 0 ? order.items : []);
      setAmountPaid(String(order.amountPaid));
      setPaymentStatus(order.paymentStatus);
      setShowPaidAddition(false);
      setPaidAddition("");
      setMarkCompleteDespiteBalance(false);
    }
  }, [order]);

  if (!order) return null;

  const numericAmountPaid = Number(amountPaid) || 0;
  const total = Number(order.totalPrice) || 0;
  const balance = Math.max(0, total - numericAmountPaid);

  // Pure Quantity-Weighted Overall Progress Calculation:
  // (Sum of quantityCompleted / Sum of quantity) * 100
  const totalQuantity = items.length > 0
    ? items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : Number(order.quantity) || 1;

  const totalQuantityCompleted = items.length > 0
    ? items.reduce((sum, it) => sum + (Number(it.quantityCompleted) || 0), 0)
    : Number(order.quantityCompleted) || 0;

  const overallProgress = totalQuantity > 0
    ? Math.min(100, Math.round((totalQuantityCompleted / totalQuantity) * 100))
    : 0;

  let derivedOrderStatus: OrderStatus = "pending";
  if (overallProgress >= 100) {
    derivedOrderStatus = balance > 0 && !markCompleteDespiteBalance ? "ready" : "completed";
  } else if (overallProgress > 0) {
    derivedOrderStatus = "in_production";
  }

  const handleItemQtyChange = (itemId: string, newCompletedStr: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const req = Number(it.quantity) || 1;
        const comp = Math.max(0, Math.min(req, Number(newCompletedStr) || 0));
        const prog = Math.min(100, Math.round((comp / req) * 100));
        let st: OrderStatus = "pending";
        if (prog >= 100) st = "completed";
        else if (prog > 0) st = "in_production";

        return {
          ...it,
          quantityCompleted: comp,
          productionProgress: prog,
          productionStatus: st,
        };
      })
    );
  };

  const handleApplyPaymentAddition = () => {
    const addition = Math.max(0, Number(paidAddition) || 0);
    const capped = Math.min(addition, balance);
    const newPaid = numericAmountPaid + capped;
    setAmountPaid(String(newPaid));
    setPaidAddition("");
    setShowPaidAddition(false);
    if (newPaid >= total) setPaymentStatus("paid");
    else if (newPaid > 0) setPaymentStatus("partial");
    else setPaymentStatus("unpaid");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. If items exist, sync item production with backend
      if (items.length > 0) {
        await updateItemProduction(order.id, {
          items: items.map((it) => ({
            id: it.id,
            quantityCompleted: it.quantityCompleted,
          })),
          allowIncompletePaymentCompletion: markCompleteDespiteBalance,
        });
      }

      // 2. Call parent onSave to update local state and emit events
      onSave(order.id, {
        amountPaid: numericAmountPaid,
        paymentStatus,
        quantity: totalQuantity,
        quantityCompleted: totalQuantityCompleted,
        status: derivedOrderStatus,
        items: items.map((it) => ({ id: it.id, quantityCompleted: it.quantityCompleted })),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save order updates:", err);
      alert("Failed to save production updates. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Production Tracking · ${order.refNo}`}
      subtitle={`${order.customerName} — ${order.product}`}
      wide
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Overall Quantity-Weighted Progress Bar */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Overall Production Progress (Pure Quantity-Weighted)</span>
            <span className="font-mono text-pink-700 font-extrabold text-sm">
              {totalQuantityCompleted} / {totalQuantity} pcs ({overallProgress}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(GRADIENT, "h-full rounded-full transition-all duration-300")}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between items-center text-[11px] text-slate-500">
            <span>Overall Order Status: <strong className="capitalize text-slate-800">{derivedOrderStatus.replace("_", " ")}</strong></span>
            <span>Due Date: <strong className="text-slate-800">{order.dueDate}</strong></span>
          </div>
        </div>

        {/* Item-Level Production Tracking */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Itemized Production Workorders ({items.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Track completion progress individually per deliverable
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{item.itemName}</span>
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {item.itemType === "service" ? (
                            <Briefcase className="h-3 w-3 text-sky-600" />
                          ) : (
                            <Boxes className="h-3 w-3 text-pink-600" />
                          )}
                          {item.category || "General"}
                        </span>
                      </div>
                      {item.itemDescription && (
                        <p className="text-xs text-slate-500 mt-0.5">{item.itemDescription}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                          item.productionStatus === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.productionStatus === "in_production"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {item.productionStatus.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Item Progress Bar */}
                    <div className="sm:col-span-6">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Progress</span>
                        <span className="font-mono font-bold">
                          {item.quantityCompleted} / {item.quantity} ({item.productionProgress}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-500 to-sky-500 transition-all duration-200"
                          style={{ width: `${item.productionProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantity Completed Input */}
                    <div className="sm:col-span-6 flex items-center justify-end gap-2">
                      <label className="text-xs font-semibold text-slate-600">Completed Qty:</label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.quantityCompleted}
                        onChange={(e) => handleItemQtyChange(item.id, e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(item.id, String(item.quantity))}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Settlement Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Financial & Payment Settlement
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Order Value</span>
              <span className="font-mono font-extrabold text-base text-slate-900">{formatCurrency(total)}</span>
            </div>

            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount Paid</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-base text-emerald-700">
                  {formatCurrency(numericAmountPaid)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaidAddition((v) => !v)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition"
                  title="Add payment"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-sm">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Remaining Balance</span>
              <span className={cn("font-mono font-extrabold text-base", balance > 0 ? "text-rose-600" : "text-slate-900")}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          {/* Quick Payment Input */}
          {showPaidAddition && (
            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-pink-200 animate-in fade-in duration-100">
              <span className="text-xs font-bold text-slate-700">Record Payment (₱):</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={balance}
                placeholder={`Up to ${formatCurrency(balance)}`}
                value={paidAddition}
                onChange={(e) => setPaidAddition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyPaymentAddition();
                  }
                }}
                className="w-48 rounded-lg border border-slate-200 px-3 py-1 text-xs font-mono font-bold focus:border-pink-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPaymentAddition}
                className="rounded-lg bg-pink-600 px-3 py-1 text-xs font-bold text-white hover:bg-pink-700"
              >
                Apply
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">Payment Status:</span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusKey)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Fully Paid</option>
            </select>
          </div>
        </div>

        {overallProgress >= 100 && (
          <div className={cn(
            "flex items-start gap-2 rounded-xl p-3 text-xs border",
            balance > 0 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
          )}>
            {balance > 0 ? (
              <>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={markCompleteDespiteBalance}
                    onChange={(e) => setMarkCompleteDespiteBalance(e.target.checked)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <span>All items are complete, but this order still has an outstanding balance. Keep it in Production Monitoring, or select this option to mark it complete despite the unpaid balance.</span>
                </label>
              </>
            ) : (
              <>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                100% of all items completed and paid. Saving will mark this order as Completed and archive it under Completed Transactions.
              </>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Production Updates"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
