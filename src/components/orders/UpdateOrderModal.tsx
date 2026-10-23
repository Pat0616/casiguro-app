// casiguro-app/src/components/orders/UpdateOrderModal.tsx
import { useEffect, useState } from "react";
import { CheckCircle2, Boxes, Briefcase, AlertCircle, FileText, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";
import type { Order, OrderItem, OrderStatus } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OrderDocumentFields, {
  EMPTY_DOCUMENT_FORM,
  SoaSummary,
  documentsChanged,
  toDocumentForm,
  toDocumentPayload,
} from "@/components/orders/OrderDocumentFields";
import { cancelOrder, updateItemProduction, updateOrder, updateOrderDocuments } from "@/utils/orderAPI";
import { useAuth } from "@/context/AuthenticationContext";
import PaymentsPanel from "@/components/orders/PaymentsPanel";
import ReasonModal from "@/components/orders/ReasonModal";

interface UpdateOrderModalProps {
  order: Order | null;
  onClose: () => void;
  /** Payments are saved immediately (the modal stays open); merge the updated order */
  onOrderChange: (order: Order) => void;
  /** Production/documents saved or order cancelled; the modal closes */
  onSaved: (order: Order) => void;
}

export default function UpdateOrderModal({ order, onClose, onOrderChange, onSaved }: UpdateOrderModalProps) {
  const { user } = useAuth();
  const [liveOrder, setLiveOrder] = useState<Order | null>(order);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [markCompleteDespiteBalance, setMarkCompleteDespiteBalance] = useState(false);
  const [documents, setDocuments] = useState(EMPTY_DOCUMENT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (order) {
      setLiveOrder(order);
      setDocuments(toDocumentForm(order));
      setItems(order.items && order.items.length > 0 ? order.items : []);
      setMarkCompleteDespiteBalance(false);
    }
  }, [order?.id]);

  if (!order || !liveOrder) return null;

  // Money comes from the payment log, which may change while the modal is open
  const balance = liveOrder.balance;
  const handlePaymentChange = (updated: Order) => {
    setLiveOrder(updated);
    onOrderChange(updated);
  };

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

  const handleSave = async () => {
    try {
      setSaving(true);
      let saved = liveOrder;
      // 1. Save reference documents (PR/PO/SI/OR/DR) if they changed
      if (documentsChanged(documents, liveOrder)) {
        saved = await updateOrderDocuments(order.id, toDocumentPayload(documents));
      }

      // 2. Sync item production (the server derives the order status); legacy orders without items update directly
      if (items.length > 0) {
        const result = await updateItemProduction(order.id, {
          items: items.map((it) => ({
            id: it.id,
            quantityCompleted: it.quantityCompleted,
          })),
          allowIncompletePaymentCompletion: markCompleteDespiteBalance,
        });
        saved = result.order;
      } else {
        saved = await updateOrder(order.id, { quantityCompleted: totalQuantityCompleted, status: derivedOrderStatus });
      }

      onSaved(saved);
      onClose();
    } catch (err) {
      console.error("Failed to save order updates:", err);
      alert(`Failed to save order updates: ${err instanceof Error ? err.message : "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Production Tracking · SOA ${order.soaNo}`}
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
                        {item.selectedVariant && (
                          <span className="ml-2 text-xs font-semibold text-sky-700">Option: {item.selectedVariant}</span>
                        )}
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

        {/* Payments (each entry is saved immediately; status and balance follow from the log) */}
        <PaymentsPanel order={liveOrder} onOrderChange={handlePaymentChange} />

        {/* Statement of Account & Reference Documents */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-sky-600" />
            Statement of Account & Reference Documents
          </h4>
          <SoaSummary soaNo={order.soaNo} soaDate={order.soaDate} />
          <OrderDocumentFields value={documents} onChange={setDocuments} />
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {user?.role === "admin" ? (
            <Button variant="ghost" onClick={() => setConfirmCancel(true)} disabled={saving} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
              <XCircle className="h-4 w-4" /> Cancel order
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Production Updates"}
            </Button>
          </div>
        </div>
      </div>

      <ReasonModal
        open={confirmCancel}
        title="Cancel order"
        subtitle={`SOA ${order.soaNo} · ${order.customerName}`}
        body={
          liveOrder.payments?.some((p) => !p.voidedAt)
            ? "This order still has payments recorded. Void them first (after refunding the customer), then cancel. The SOA No stays used and the order is kept on record as cancelled."
            : "The order is removed from production and sales totals but kept on record as cancelled. Its SOA No is not reused. This can't be undone."
        }
        confirmLabel="Cancel order"
        onConfirm={async (reason) => {
          onSaved(await cancelOrder(order.id, reason));
          onClose();
        }}
        onClose={() => setConfirmCancel(false)}
      />
    </Modal>
  );
}
