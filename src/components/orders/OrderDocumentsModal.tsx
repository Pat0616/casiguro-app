import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Order } from "@/types";
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

interface OrderDocumentsModalProps {
  order: Order | null;
  onClose: () => void;
  onSaved: (order: Order) => void;
}

export default function OrderDocumentsModal({ order, onClose, onSaved }: OrderDocumentsModalProps) {
  const [form, setForm] = useState<OrderDocumentForm>(EMPTY_DOCUMENT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setForm(toDocumentForm(order));
      setError(null);
    }
  }, [order]);

  if (!order) return null;

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
    <Modal open={!!order} onClose={onClose} title={`Documents · SOA ${order.soaNo}`} subtitle={`${order.customerName} — ${order.product}`}>
      <div className="space-y-5">
        <SoaSummary soaNo={order.soaNo} soaDate={order.soaDate} />
        <OrderDocumentFields value={form} onChange={setForm} />
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
