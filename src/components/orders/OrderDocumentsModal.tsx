import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Order } from "@/types";
import { formatDocDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OrderDocumentFields, {
  EMPTY_DOCUMENT_FORM,
  SoaSummary,
  documentsChanged,
  toDocumentForm,
  toDocumentPayload,
  type OrderDocumentForm,
} from "@/components/orders/OrderDocumentFields";
import { updateOrderDocuments } from "@/utils/orderAPI";
import PaymentsPanel from "@/components/orders/PaymentsPanel";

interface OrderDocumentsModalProps {
  order: Order | null;
  onClose: () => void;
  /** Documents saved, or a payment recorded/voided (those save immediately) */
  onSaved: (order: Order) => void;
}

export default function OrderDocumentsModal({ order: selectedOrder, onClose, onSaved }: OrderDocumentsModalProps) {
  const [order, setOrder] = useState<Order | null>(selectedOrder);
  const [form, setForm] = useState<OrderDocumentForm>(EMPTY_DOCUMENT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrder(selectedOrder);
    if (selectedOrder) {
      setForm(toDocumentForm(selectedOrder));
      setError(null);
    }
  }, [selectedOrder?.id]);

  if (!selectedOrder || !order) return null;

  const handlePaymentChange = (updated: Order) => {
    setOrder(updated);
    onSaved(updated);
  };

  const handleSave = async () => {
    if (!documentsChanged(form, order)) {
      onClose();
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const updated = await updateOrderDocuments(order.id, toDocumentPayload(form));
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save documents.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!order} onClose={onClose} title={`Documents · SOA ${order.soaNo}`} subtitle={`${order.customerName} — ${order.product}`} wide>
      <div className="space-y-5">
        {order.status === "cancelled" && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <strong className="text-slate-800">Cancelled</strong>
            {order.cancelledByName && ` by ${order.cancelledByName}`}
            {order.cancelledAt && ` on ${formatDocDate(order.cancelledAt.slice(0, 10))}`}: {order.cancelReason}
          </div>
        )}
        <SoaSummary soaNo={order.soaNo} soaDate={order.soaDate} />
        <OrderDocumentFields value={form} onChange={setForm} />
        <PaymentsPanel order={order} onOrderChange={handlePaymentChange} />
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save documents"}</Button>
        </div>
      </div>
    </Modal>
  );
}
