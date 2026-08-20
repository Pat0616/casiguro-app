import { FormEvent, useState } from "react";
import { Factory, PackageCheck, Plus } from "lucide-react";
import { cn, formatCurrency, isoDate } from "@/lib/utils";
import { CATEGORIES, NOW } from "@/lib/constants";
import type { NewOrderFormData, OrderType } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewOrderFormData) => void;
}

const emptyForm = {
  customerName: "",
  contactNumber: "",
  product: "",
  category: CATEGORIES[0],
  quantity: 1,
  unitPrice: 0,
  notes: "",
  dateOrdered: isoDate(NOW),
  dueDate: isoDate(NOW),
};

export default function NewOrderModal({ open, onClose, onCreate }: NewOrderModalProps) {
  const [orderType, setOrderType] = useState<OrderType>("custom");
  const [form, setForm] = useState(emptyForm);

  if (!open) return null;
  const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.product) return;
    onCreate({ ...form, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice), orderType });
    setForm(emptyForm);
    setOrderType("custom");
  };

  return (
    <Modal open={open} onClose={onClose} title="New Order" subtitle="Record a new customer transaction" wide>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-600">Order Type</span>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "custom" as const, label: "Custom Order", desc: "Requires production before completion.", icon: Factory },
                { key: "stock" as const, label: "Stock Order", desc: "Ready-made — completes immediately.", icon: PackageCheck },
              ]
            ).map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => setOrderType(t.key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  orderType === t.key ? "border-pink-300 bg-pink-50/60 ring-2 ring-pink-100" : "border-slate-200 hover:border-slate-300"
                )}
              >
                <t.icon className={cn("mb-2 h-5 w-5", orderType === t.key ? "text-pink-600" : "text-slate-400")} />
                <p className="text-sm font-bold text-slate-800">{t.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name of Customer">
            <input required className={inputClass} value={form.customerName} onChange={update("customerName")} placeholder="Juan Dela Cruz" />
          </Field>
          <Field label="Contact Info">
            <input className={inputClass} value={form.contactNumber} onChange={update("contactNumber")} placeholder="0917 000 0000" />
          </Field>
          <Field label="Product">
            <input required className={inputClass} value={form.product} onChange={update("product")} placeholder="Custom T-Shirts" />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={update("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Quantity">
            <input type="number" min="1" className={inputClass} value={form.quantity} onChange={update("quantity")} />
          </Field>
          <Field label="Unit Price">
            <input type="number" min="0" step="0.01" className={inputClass} value={form.unitPrice} onChange={update("unitPrice")} />
          </Field>
          <Field label="Total Price (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>{formatCurrency(total)}</div>
          </Field>
          <Field label="Date Ordered">
            <input type="date" className={inputClass} value={form.dateOrdered} onChange={update("dateOrdered")} />
          </Field>
          <Field label="Due Date">
            <input type="date" className={inputClass} value={form.dueDate} onChange={update("dueDate")} />
          </Field>
        </div>

        <Field label="Notes / Special Instructions">
          <textarea rows={3} className={inputClass} value={form.notes} onChange={update("notes")} placeholder="Optional notes..." />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">
            <Plus className="h-4 w-4" /> Save Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
