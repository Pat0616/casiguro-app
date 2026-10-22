import { FileText } from "lucide-react";
import { formatDocDate } from "@/lib/utils";
import type { OrderDocuments } from "@/types";
import Field, { inputClass } from "@/components/ui/Field";

export type OrderDocumentForm = Record<keyof OrderDocuments, string>;

export const EMPTY_DOCUMENT_FORM: OrderDocumentForm = {
  prNo: "",
  poNo: "",
  siOrNo: "",
  siOrDate: "",
  drNo: "",
  drDate: "",
};

export function toDocumentForm(docs: OrderDocuments): OrderDocumentForm {
  return {
    prNo: docs.prNo ?? "",
    poNo: docs.poNo ?? "",
    siOrNo: docs.siOrNo ?? "",
    siOrDate: docs.siOrDate ?? "",
    drNo: docs.drNo ?? "",
    drDate: docs.drDate ?? "",
  };
}

export function toDocumentPayload(form: OrderDocumentForm): OrderDocuments {
  const clean = (value: string) => value.trim() || null;
  return {
    prNo: clean(form.prNo),
    poNo: clean(form.poNo),
    siOrNo: clean(form.siOrNo),
    siOrDate: clean(form.siOrDate),
    drNo: clean(form.drNo),
    drDate: clean(form.drDate),
  };
}

export function documentsChanged(form: OrderDocumentForm, docs: OrderDocuments): boolean {
  const next = toDocumentPayload(form);
  return (Object.keys(next) as (keyof OrderDocuments)[]).some((key) => next[key] !== (docs[key] ?? null));
}

const FIELDS: { key: keyof OrderDocuments; label: string; type: "text" | "date"; placeholder?: string }[] = [
  { key: "prNo", label: "PR No", type: "text", placeholder: "Purchase Request No" },
  { key: "poNo", label: "PO No", type: "text", placeholder: "Purchase Order No" },
  { key: "siOrNo", label: "SI/OR No", type: "text", placeholder: "Sales Invoice / Official Receipt No" },
  { key: "siOrDate", label: "SI/OR Date", type: "date" },
  { key: "drNo", label: "DR No", type: "text", placeholder: "Delivery Receipt No" },
  { key: "drDate", label: "DR Date", type: "date" },
];

interface OrderDocumentFieldsProps {
  value: OrderDocumentForm;
  onChange: (value: OrderDocumentForm) => void;
}

export default function OrderDocumentFields({ value, onChange }: OrderDocumentFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <Field key={field.key} label={`${field.label} (optional)`}>
          <input
            type={field.type}
            maxLength={field.type === "text" ? 50 : undefined}
            value={value[field.key]}
            onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
            placeholder={field.placeholder}
            className={inputClass}
          />
        </Field>
      ))}
    </div>
  );
}

export function SoaSummary({ soaNo, soaDate }: { soaNo?: string; soaDate?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
          <FileText className="h-3 w-3" /> SOA No
        </span>
        <span className="mt-0.5 block font-mono text-sm font-bold text-slate-900">{soaNo || "Assigned on save"}</span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="block text-[10px] font-bold uppercase text-slate-400">SOA Date</span>
        <span className="mt-0.5 block font-mono text-sm font-bold text-slate-900">{soaDate ? formatDocDate(soaDate) : "Date of creation"}</span>
      </div>
    </div>
  );
}
