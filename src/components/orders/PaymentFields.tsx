// casiguro-app/src/components/orders/PaymentFields.tsx
// Inputs for one payment entry. Used by PaymentsPanel and for the optional down payment when an order is created.
import type { PaymentInput, PaymentMethod, PaymentType } from "@/types";
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from "@/lib/constants";
import Field, { inputClass } from "@/components/ui/Field";

export interface PaymentForm {
  paymentType: PaymentType;
  method: PaymentMethod;
  amount: string;
  receivedOn: string;
  referenceNo: string;
  checkBank: string;
  checkDate: string;
  orNo: string;
  note: string;
}

export const EMPTY_PAYMENT_FORM: PaymentForm = {
  paymentType: "payment",
  method: "cash",
  amount: "",
  receivedOn: "",
  referenceNo: "",
  checkBank: "",
  checkDate: "",
  orNo: "",
  note: "",
};

// Blank optional fields are left out; a blank date means "today" on the server
export function toPaymentInput(form: PaymentForm): PaymentInput {
  const isEwt = form.paymentType === "ewt";
  const isCheck = !isEwt && form.method === "check";
  const optional = (value: string) => value.trim() || undefined;
  return {
    paymentType: form.paymentType,
    method: isEwt ? undefined : form.method,
    amount: Number(form.amount),
    receivedOn: optional(form.receivedOn),
    referenceNo: optional(form.referenceNo),
    checkBank: isCheck ? optional(form.checkBank) : undefined,
    checkDate: isCheck ? optional(form.checkDate) : undefined,
    orNo: optional(form.orNo),
    note: optional(form.note),
  };
}

function referenceLabel(form: PaymentForm) {
  if (form.paymentType === "ewt") return "BIR 2307 certificate no.";
  if (form.method === "check") return "Check no. (required)";
  if (form.method === "cash") return "Reference no. (optional)";
  return `${PAYMENT_METHOD_LABELS[form.method]} reference no.`;
}

interface PaymentFieldsProps {
  value: PaymentForm;
  onChange: (form: PaymentForm) => void;
  /** Payment types to offer; the down payment form at order creation offers none (type is fixed) */
  types?: PaymentType[];
  maxAmount?: number;
}

export default function PaymentFields({ value, onChange, types = ["payment", "down_payment", "ewt"], maxAmount }: PaymentFieldsProps) {
  const set = (patch: Partial<PaymentForm>) => onChange({ ...value, ...patch });
  const isEwt = value.paymentType === "ewt";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {types.length > 1 && (
        <Field label="Type">
          <select className={inputClass} value={value.paymentType} onChange={(e) => set({ paymentType: e.target.value as PaymentType })}>
            {types.map((t) => (
              <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>
      )}
      {!isEwt && (
        <Field label="Method">
          <select className={inputClass} value={value.method} onChange={(e) => set({ method: e.target.value as PaymentMethod })}>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label={isEwt ? "Amount withheld (₱)" : "Amount (₱)"}>
        {/* Text input so there are no spinner arrows; only digits and up to 2 decimals are accepted */}
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={maxAmount != null ? `Up to ${maxAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "0.00"}
          className={inputClass}
          value={value.amount}
          onChange={(e) => {
            const amount = e.target.value.trim();
            if (/^\d*\.?\d{0,2}$/.test(amount)) set({ amount });
          }}
        />
      </Field>
      <Field label="Date received (blank = today)">
        <input type="date" className={inputClass} value={value.receivedOn} onChange={(e) => set({ receivedOn: e.target.value })} />
      </Field>
      <Field label={referenceLabel(value)}>
        <input maxLength={100} className={inputClass} value={value.referenceNo} onChange={(e) => set({ referenceNo: e.target.value })} />
      </Field>
      {!isEwt && value.method === "check" && (
        <>
          <Field label="Bank">
            <input maxLength={100} className={inputClass} value={value.checkBank} onChange={(e) => set({ checkBank: e.target.value })} />
          </Field>
          <Field label="Check date">
            <input type="date" className={inputClass} value={value.checkDate} onChange={(e) => set({ checkDate: e.target.value })} />
          </Field>
        </>
      )}
      <Field label="OR no. (Official Receipt)">
        <input maxLength={50} className={inputClass} value={value.orNo} onChange={(e) => set({ orNo: e.target.value })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Note (optional)">
          <input maxLength={500} className={inputClass} value={value.note} onChange={(e) => set({ note: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}
