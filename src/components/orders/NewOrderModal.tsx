import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Factory,
  PackageCheck,
  Plus,
  User,
  Phone,
  ChevronDown,
  Check,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency, isoDate } from "@/lib/utils";
import { CATEGORIES, NOW } from "@/lib/constants";
import type { NewOrderFormData, OrderType } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { getCustomers, CustomerSuggestion } from "@/utils/customerAPI";

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

  // Database customer suggestions
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);

  // Category combobox state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);

  // Field Navigation Refs for Fast Transaction Recording
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const contactNumberRef = useRef<HTMLInputElement>(null);
  const productRef = useRef<HTMLInputElement>(null);
  const categoryBtnRef = useRef<HTMLButtonElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const unitPriceRef = useRef<HTMLInputElement>(null);
  const dateOrderedRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch customers from database when modal opens
  useEffect(() => {
    if (open) {
      getCustomers()
        .then((data) => setCustomers(data))
        .catch((err) => console.error("Failed to load customer suggestions:", err));

      // Auto-focus the first field for instant typing
      setTimeout(() => {
        customerNameRef.current?.focus();
      }, 80);
    } else {
      setShowCustomerSuggestions(false);
      setIsCategoryOpen(false);
      setCustomerHighlightIndex(-1);
    }
  }, [open]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerSuggestions(false);
      }
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(e.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered customer suggestions
  const filteredCustomers = useMemo(() => {
    const query = form.customerName.trim().toLowerCase();
    if (!query) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.contactNumber.toLowerCase().includes(query)
      )
      .slice(0, 7);
  }, [customers, form.customerName]);

  if (!open) return null;
  const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  const update = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (key === "customerName") {
      setShowCustomerSuggestions(true);
      setCustomerHighlightIndex(0);
    }
  };

  // Select customer from suggestion list
  const selectCustomer = (c: CustomerSuggestion) => {
    setForm((f) => ({
      ...f,
      customerName: c.name,
      contactNumber: c.contactNumber || f.contactNumber,
    }));
    setShowCustomerSuggestions(false);
    setCustomerHighlightIndex(-1);
    // Proceed to contact info (editable)
    setTimeout(() => {
      contactNumberRef.current?.focus();
    }, 50);
  };

  // Customer Name Keyboard Navigation
  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showCustomerSuggestions && filteredCustomers.length > 0) {
        setShowCustomerSuggestions(true);
        setCustomerHighlightIndex(0);
      } else if (filteredCustomers.length > 0) {
        setCustomerHighlightIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredCustomers.length > 0) {
        setCustomerHighlightIndex((prev) =>
          prev <= 0 ? filteredCustomers.length - 1 : prev - 1
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        showCustomerSuggestions &&
        customerHighlightIndex >= 0 &&
        customerHighlightIndex < filteredCustomers.length
      ) {
        selectCustomer(filteredCustomers[customerHighlightIndex]);
      } else {
        setShowCustomerSuggestions(false);
        contactNumberRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowCustomerSuggestions(false);
    }
  };

  // Category Combobox Keyboard Navigation
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsCategoryOpen(true);
      const nextIdx = (categoryHighlightIndex + 1) % CATEGORIES.length;
      setCategoryHighlightIndex(nextIdx);
      setForm((f) => ({ ...f, category: CATEGORIES[nextIdx] }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsCategoryOpen(true);
      const prevIdx =
        categoryHighlightIndex <= 0
          ? CATEGORIES.length - 1
          : categoryHighlightIndex - 1;
      setCategoryHighlightIndex(prevIdx);
      setForm((f) => ({ ...f, category: CATEGORIES[prevIdx] }));
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      setIsCategoryOpen((prev) => !prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setIsCategoryOpen(false);
      quantityRef.current?.focus();
      quantityRef.current?.select();
    } else if (e.key === "Escape") {
      setIsCategoryOpen(false);
    }
  };

  // Calendar Space and Enter Navigation
  const handleDateKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      // Invoke native browser calendar picker
      const target = e.currentTarget;
      if (typeof target.showPicker === "function") {
        target.showPicker();
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.product) return;
    onCreate({
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      orderType,
    });
    setForm(emptyForm);
    setOrderType("custom");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Order"
      subtitle="Fast transaction recording with keyboard navigation"
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-600">
            Order Type
          </span>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                key: "custom" as const,
                label: "Custom Order",
                desc: "Requires production before completion.",
                icon: Factory,
              },
              {
                key: "stock" as const,
                label: "Stock Order",
                desc: "Ready-made — completes immediately.",
                icon: PackageCheck,
              },
            ].map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => setOrderType(t.key)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  orderType === t.key
                    ? "border-pink-300 bg-pink-50/60 ring-2 ring-pink-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <t.icon
                  className={cn(
                    "mb-2 h-5 w-5",
                    orderType === t.key ? "text-pink-600" : "text-slate-400"
                  )}
                />
                <p className="text-sm font-bold text-slate-800">{t.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 1. Customer Name with Suggestive Combobox */}
          <div ref={customerContainerRef} className="relative">
            <Field label="Name of Customer">
              <input
                ref={customerNameRef}
                required
                className={inputClass}
                value={form.customerName}
                onChange={update("customerName")}
                onFocus={() => {
                  if (form.customerName.trim().length > 0) {
                    setShowCustomerSuggestions(true);
                  }
                }}
                onKeyDown={handleCustomerKeyDown}
                placeholder="Type customer name..."
                autoComplete="off"
              />
            </Field>

            {/* Floating Suggestions Dropdown */}
            {showCustomerSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute left-0 right-0 top-[102%] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Previous Customers (Database)
                </div>
                {filteredCustomers.map((cust, idx) => {
                  const isHighlighted = idx === customerHighlightIndex;
                  return (
                    <button
                      key={cust.id || cust.name}
                      type="button"
                      onClick={() => selectCustomer(cust)}
                      onMouseEnter={() => setCustomerHighlightIndex(idx)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isHighlighted
                          ? "bg-pink-50 text-pink-800 font-semibold"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User className={cn("h-4 w-4 shrink-0", isHighlighted ? "text-pink-600" : "text-slate-400")} />
                        <span className="truncate">{cust.name}</span>
                      </div>
                      {cust.contactNumber && (
                        <span className="shrink-0 font-mono text-xs text-slate-400">
                          {cust.contactNumber}
                        </span>
                      )}
                    </button>
                  );
                })}
                <div className="border-t border-slate-100 mt-1 pt-1 px-2.5 text-[10px] text-slate-400 flex justify-between">
                  <span>Use ↑ / ↓ to navigate</span>
                  <span>Press ↵ Enter to auto-fill</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Contact Info */}
          <Field label="Contact Info">
            <input
              ref={contactNumberRef}
              className={inputClass}
              value={form.contactNumber}
              onChange={update("contactNumber")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  productRef.current?.focus();
                }
              }}
              placeholder="0917 000 0000"
            />
          </Field>

          {/* 3. Product */}
          <Field label="Product">
            <input
              ref={productRef}
              required
              className={inputClass}
              value={form.product}
              onChange={update("product")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  categoryBtnRef.current?.focus();
                }
              }}
              placeholder="Custom T-Shirts"
            />
          </Field>

          {/* 4. Category Combobox */}
          <div ref={categoryContainerRef} className="relative">
            <Field label="Category (↓ Arrow opens choices)">
              <button
                ref={categoryBtnRef}
                type="button"
                className={cn(inputClass, "flex items-center justify-between text-left")}
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                onKeyDown={handleCategoryKeyDown}
              >
                <span className="font-medium text-slate-800">{form.category}</span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", isCategoryOpen && "rotate-180")} />
              </button>
            </Field>

            {isCategoryOpen && (
              <div className="absolute left-0 right-0 top-[102%] z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Category (↓/↑ arrows, ↵ Enter)
                </div>
                {CATEGORIES.map((c, idx) => {
                  const isSelected = form.category === c;
                  const isHighlighted = idx === categoryHighlightIndex;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, category: c }));
                        setCategoryHighlightIndex(idx);
                        setIsCategoryOpen(false);
                        quantityRef.current?.focus();
                        quantityRef.current?.select();
                      }}
                      onMouseEnter={() => setCategoryHighlightIndex(idx)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-pink-50 font-bold text-pink-700"
                          : isHighlighted
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span>{c}</span>
                      {isSelected && <Check className="h-4 w-4 text-pink-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Quantity */}
          <Field label="Quantity">
            <input
              ref={quantityRef}
              type="number"
              min="1"
              className={inputClass}
              value={form.quantity}
              onChange={update("quantity")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  unitPriceRef.current?.focus();
                  unitPriceRef.current?.select();
                }
              }}
            />
          </Field>

          {/* 6. Unit Price */}
          <Field label="Unit Price">
            <input
              ref={unitPriceRef}
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.unitPrice}
              onChange={update("unitPrice")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  dateOrderedRef.current?.focus();
                }
              }}
            />
          </Field>

          {/* Total Price Auto */}
          <Field label="Total Price (Automatic)">
            <div className={cn(inputClass, "flex items-center bg-slate-50 font-bold text-slate-700")}>
              {formatCurrency(total)}
            </div>
          </Field>

          {/* 7. Date Ordered (Space opens calendar picker) */}
          <Field label="Date Ordered (Space opens calendar)">
            <input
              ref={dateOrderedRef}
              type="date"
              className={inputClass}
              value={form.dateOrdered}
              onChange={update("dateOrdered")}
              onKeyDown={(e) => handleDateKeyDown(e, dueDateRef)}
            />
          </Field>

          {/* 8. Due Date (Space opens calendar picker) */}
          <Field label="Due Date (Space opens calendar)">
            <input
              ref={dueDateRef}
              type="date"
              className={inputClass}
              value={form.dueDate}
              onChange={update("dueDate")}
              onKeyDown={(e) => handleDateKeyDown(e, notesRef)}
            />
          </Field>
        </div>

        {/* 9. Notes */}
        <Field label="Notes / Special Instructions (↵ Enter to Save)">
          <textarea
            ref={notesRef}
            rows={3}
            className={inputClass}
            value={form.notes}
            onChange={update("notes")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitBtnRef.current?.focus();
              }
            }}
            placeholder="Optional notes... (Press Enter to proceed to Save button, Shift+Enter for new line)"
          />
        </Field>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-600">↵ Enter</span>
            <span>next field</span>
            <span className="mx-1">·</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-600">Space</span>
            <span>open calendar</span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button ref={submitBtnRef} type="submit">
              <Plus className="h-4 w-4" /> Save Order
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
