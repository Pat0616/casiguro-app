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
import { cancelOrder, getOrderById, updateItemProduction, updateOrder, updateOrderDocuments } from "@/utils/orderAPI";
import { useAuth } from "@/context/AuthenticationContext";
import PaymentsPanel from "@/components/orders/PaymentsPanel";
import ReasonModal from "@/components/orders/ReasonModal";
import ProductionQtyInput, { parseAdded } from "@/components/orders/ProductionQtyInput";

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
  const [error, setError] = useState<string | null>(null);
  // Concurrency: `baseline` is the server value each item's edit started from (sent back on save so the server can
  // refuse a stale save), `dirty` the items this user changed, `conflicts` the new server value of a dirty item
  // that someone else saved while this modal was open.
  const [baseline, setBaseline] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [conflicts, setConflicts] = useState<Record<string, number>>({});
  // Pcs finished since the last update, as typed per item; the item's total is baseline + this
  const [added, setAdded] = useState<Record<string, string>>({});

  const loadOrder = (o: Order) => {
    const orderItems = o.items && o.items.length > 0 ? o.items : [];
    setLiveOrder(o);
    setItems(orderItems);
    setBaseline(Object.fromEntries(orderItems.map((it) => [it.id, it.quantityCompleted])));
    setDirty(new Set());
    setConflicts({});
    setAdded({});
  };

  useEffect(() => {
    if (order) {
      loadOrder(order);
      setDocuments(toDocumentForm(order));
      setMarkCompleteDespiteBalance(false);
      setError(null);
    }
  }, [order?.id]);

  // Live updates while the modal is open (someone else saved, or a payment was recorded): untouched items take the
  // server values; edited items keep the user's input and are flagged if the server value moved underneath them.
  useEffect(() => {
    if (!order || order.id !== liveOrder?.id) return;
    setLiveOrder(order);
    const serverItems = order.items || [];
    const nextConflicts: Record<string, number> = {};
    setItems((prev) =>
      prev.map((it) => {
        const server = serverItems.find((s) => s.id === it.id);
        if (!server) return it;
        if (!dirty.has(it.id)) return server;
        if (server.quantityCompleted !== baseline[it.id]) nextConflicts[it.id] = server.quantityCompleted;
        return it;
      })
    );
    setBaseline((prev) => {
      const next = { ...prev };
      serverItems.forEach((s) => {
        if (!dirty.has(s.id)) next[s.id] = s.quantityCompleted;
      });
      return next;
    });
    setConflicts(nextConflicts);
  }, [order]);

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
    setDirty((prev) => new Set(prev).add(itemId));
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

  const handleAddedChange = (item: OrderItem, text: string) => {
    setAdded((prev) => ({ ...prev, [item.id]: text }));
    const before = baseline[item.id] ?? item.quantityCompleted;
    handleItemQtyChange(item.id, String(before + parseAdded(text)));
  };

  // Back to the server value; the item is no longer sent on save
  const handleUndoAdded = (item: OrderItem) => {
    handleAddedChange(item, "");
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      let saved = liveOrder;
      // 1. Sync item production first (the server derives the order status), so a conflict saves nothing.
      //    Only items this user changed are sent, each with the value it started from.
      //    Legacy orders without items update directly.
      if (items.length > 0) {
        const result = await updateItemProduction(order.id, {
          items: items
            .filter((it) => dirty.has(it.id))
            .map((it) => ({
              id: it.id,
              quantityCompleted: it.quantityCompleted,
              previousQuantityCompleted: baseline[it.id],
            })),
          allowIncompletePaymentCompletion: markCompleteDespiteBalance,
        });
        saved = result.order;
      } else {
        saved = await updateOrder(order.id, { quantityCompleted: totalQuantityCompleted, status: derivedOrderStatus });
      }

      // 2. Save reference documents (PR/PO/SI/OR/DR) if they changed
      if (documentsChanged(documents, liveOrder)) {
        saved = await updateOrderDocuments(order.id, toDocumentPayload(documents));
      }

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error("Failed to save order updates:", err);
      if (err?.status === 409) {
        // Someone else saved first: show their values; the user re-applies their change
        const latest = await getOrderById(order.id).catch(() => null);
        if (latest) {
          loadOrder(latest);
          onOrderChange(latest);
        }
        setError(`${err.message} The latest values are shown now. Please enter your update again.`);
      } else {
        setError(`Failed to save order updates: ${err instanceof Error ? err.message : "Please try again."}`);
      }
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

                  {conflicts[item.id] != null && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>
                        Someone else updated this item to <strong>{conflicts[item.id]}/{item.quantity}</strong> while you were editing.
                        Saving now will be refused; check with them, then re-enter the pcs you added.
                      </span>
                    </div>
                  )}

                  <div className="mt-3 space-y-3">
                    {/* Item Progress Bar */}
                    <div>
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

                    <ProductionQtyInput
                      quantity={Number(item.quantity) || 0}
                      completedBefore={baseline[item.id] ?? item.quantityCompleted}
                      value={added[item.id] ?? ""}
                      onChange={(text) => handleAddedChange(item, text)}
                      onUndo={() => handleUndoAdded(item)}
                    />
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

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
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
