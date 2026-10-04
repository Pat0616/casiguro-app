import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Factory,
  PackageCheck,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { cn, formatCurrency, isoDate } from "@/lib/utils";
import { CATEGORIES, NOW } from "@/lib/constants";
import type { CatalogItem, NewOrderFormData, OrderType } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import { getCustomers, type CustomerSuggestion } from "@/utils/customerAPI";
import { getCatalogItems } from "@/utils/catalogAPI";

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewOrderFormData) => void;
}

const makeEmptyItem = () => ({
  tempId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  productServiceId: null as string | null,
  itemName: "",
  itemDescription: "",
  category: "General",
  itemType: "product" as "product" | "service",
  isCustom: false,
  quantity: 1,
  basePrice: 0,
  finalUnitPrice: 0,
  priceAdjustmentReason: "",
  subtotal: 0,
});

const emptyForm = {
  customerName: "",
  contactNumber: "",
  notes: "",
  dateOrdered: isoDate(NOW),
  dueDate: isoDate(NOW),
};

export default function NewOrderModal({ open, onClose, onCreate }: NewOrderModalProps) {
  const [orderType, setOrderType] = useState<OrderType>("custom");
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);
  const [formError, setFormError] = useState<string | null>(null);

  const [items, setItems] = useState<ReturnType<typeof makeEmptyItem>[]>([makeEmptyItem()]);

  const customersLoadedRef = useRef(false);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    setLoadingCatalog(true);
    Promise.all([getCatalogItems({ includeInactive: false }), getCustomers()])
      .then(([catalog, customerList]) => {
        setCatalogItems(catalog);
        setCustomers(customerList);
      })
      .catch((err) => console.error("Error loading order dependencies:", err))
      .finally(() => setLoadingCatalog(false));

    if (!customersLoadedRef.current) {
      customersLoadedRef.current = true;
      getCustomers()
        .then((data) => setCustomers(data))
        .catch((err) => console.error("Failed to load customer suggestions:", err));
    }

    setTimeout(() => customerNameRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerContainerRef.current &&
        !customerContainerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomerSuggestions = useMemo(
    () =>
      customers.filter(
        (c) =>
          form.customerName.trim() &&
          c.name.toLowerCase().includes(form.customerName.trim().toLowerCase())
      ),
    [customers, form.customerName]
  );

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      contactNumber: customer.contactNumber || prev.contactNumber,
    }));
    setShowCustomerSuggestions(false);
  };

  const handleAddItem = () => setItems((prev) => [...prev, makeEmptyItem()]);

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCatalogSelection = (index: number, catalogId: string) => {
    const found = catalogItems.find((item) => item.id === catalogId);
    if (!found) return;

    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const qty = it.quantity || 1;
        const basePrice = Number(found.basePrice || found.defaultUnitPrice || 0);
        return {
          ...it,
          productServiceId: found.id,
          itemName: found.name,
          itemDescription: found.description || "",
          category: found.categoryName || "General",
          itemType: found.type,
          isCustom: false,
          basePrice,
          finalUnitPrice: basePrice,
          priceAdjustmentReason: "",
          subtotal: Number((qty * basePrice).toFixed(2)),
        };
      })
    );
  };

  const handleToggleCustom = (index: number, isCustom: boolean) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        return {
          ...it,
          isCustom,
          productServiceId: isCustom ? null : it.productServiceId,
          itemName: isCustom ? "" : it.itemName || "",
          basePrice: isCustom ? 0 : it.basePrice,
          finalUnitPrice: isCustom ? 0 : it.finalUnitPrice,
          priceAdjustmentReason: isCustom ? "" : it.priceAdjustmentReason,
          subtotal: isCustom ? 0 : it.subtotal,
        };
      })
    );
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;

        const updated = { ...it, [field]: value };
        const qty = field === "quantity" ? Math.max(1, Number(value) || 1) : updated.quantity;
        const finalPrice =
          field === "finalUnitPrice" ? Math.max(0, Number(value) || 0) : updated.finalUnitPrice;

        updated.quantity = qty;
        updated.finalUnitPrice = finalPrice;
        updated.subtotal = Number((qty * finalPrice).toFixed(2));

        return updated;
      })
    );
  };

  const totalOrderAmount = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (items.length === 0) {
      setFormError("At least one item is required for this order.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName.trim() && !item.isCustom) {
        setFormError(`Item #${i + 1} needs a catalog item or a custom item name.`);
        return;
      }

      if (item.isCustom && !item.itemName.trim()) {
        setFormError(`Custom item #${i + 1} needs a valid item name.`);
        return;
      }

      if (item.quantity <= 0) {
        setFormError(`Item "${item.itemName || `#${i + 1}`}" must have a quantity greater than 0.`);
        return;
      }

      if (item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001) {
        if (!item.priceAdjustmentReason || !item.priceAdjustmentReason.trim()) {
          setFormError(
            `Item #${i + 1} has an adjusted price. Please enter a price adjustment reason.`
          );
          return;
        }
      }
    }

    const mappedItems = items.map((item) => ({
      productServiceId: item.productServiceId,
      itemName: item.itemName.trim(),
      itemDescription: item.itemDescription?.trim() || undefined,
      category: item.category?.trim() || "General",
      itemType: item.itemType,
      isCustom: item.isCustom,
      quantity: item.quantity,
      basePrice: item.basePrice,
      finalUnitPrice: item.finalUnitPrice,
      priceAdjustmentReason:
        item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001
          ? item.priceAdjustmentReason.trim()
          : null,
      subtotal: item.subtotal,
    }));

    onCreate({
      customerName: form.customerName.trim(),
      contactNumber: form.contactNumber.trim(),
      product: mappedItems.map((item) => item.itemName).join(", ") || "Custom order",
      category: mappedItems[0]?.category || CATEGORIES[0],
      quantity: totalQuantity,
      unitPrice: mappedItems[0]?.finalUnitPrice || 0,
      notes: form.notes.trim(),
      dateOrdered: form.dateOrdered,
      dueDate: form.dueDate,
      orderType,
      items: mappedItems,
    });

    setForm({ ...emptyForm, dateOrdered: isoDate(NOW), dueDate: isoDate(NOW) });
    setItems([makeEmptyItem()]);
    setOrderType("custom");
    setFormError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Direct Order"
      subtitle="Confirm and forward an order straight to production monitoring"
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-600">Order Type</span>
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
                    ? "border-sky-300 bg-sky-50/60 ring-2 ring-sky-100"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <t.icon
                  className={cn(
                    "mb-2 h-5 w-5",
                    orderType === t.key ? "text-sky-600" : "text-slate-400"
                  )}
                />
                <p className="text-sm font-bold text-slate-800">{t.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div ref={customerContainerRef} className="relative">
            <Field label="Customer Name">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  ref={customerNameRef}
                  type="text"
                  className={cn(inputClass, "pl-9")}
                  value={form.customerName}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, customerName: e.target.value }));
                    setShowCustomerSuggestions(true);
                  }}
                  onFocus={() => form.customerName.trim() && setShowCustomerSuggestions(true)}
                  placeholder="Customer name"
                  autoComplete="off"
                />
              </div>
            </Field>

            {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[102%] z-50 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5">
                {filteredCustomerSuggestions.map((customer, idx) => (
                  <button
                    key={customer.id || customer.name}
                    type="button"
                    onClick={() => handleSelectCustomer(customer)}
                    onMouseEnter={() => setCustomerHighlightIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      idx === customerHighlightIndex
                        ? "bg-sky-50 text-sky-800 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>{customer.name}</span>
                    {customer.contactNumber && (
                      <span className="text-[11px] text-slate-400">{customer.contactNumber}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Contact Number">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className={cn(inputClass, "pl-9")}
                value={form.contactNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, contactNumber: e.target.value }))}
                placeholder="0917 000 0000"
              />
            </div>
          </Field>

          <Field label="Date Ordered">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                className={cn(inputClass, "pl-9")}
                value={form.dateOrdered}
                onChange={(e) => setForm((prev) => ({ ...prev, dateOrdered: e.target.value }))}
              />
            </div>
          </Field>

          <Field label="Due Date">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="date"
                className={cn(inputClass, "pl-9")}
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Order Line Items</p>
              <p className="text-xs text-slate-500">Select from the catalog and adjust pricing when needed.</p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.tempId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">Item {index + 1}</span>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Catalog Item
                    </label>
                    <div className="relative">
                      <select
                        value={item.productServiceId || ""}
                        onChange={(e) => handleCatalogSelection(index, e.target.value)}
                        className={cn(inputClass, "appearance-none pr-10")}
                      >
                        <option value="">Select from catalog...</option>
                        {catalogItems.map((catalogItem) => (
                          <option key={catalogItem.id} value={catalogItem.id}>
                            {catalogItem.name} — {formatCurrency(catalogItem.basePrice)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        Custom Item
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleCustom(index, !item.isCustom)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition",
                          item.isCustom
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-600"
                        )}
                      >
                        <span>{item.isCustom ? "Custom entry" : "Catalog item"}</span>
                        {item.isCustom ? <Check className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemFieldChange(index, "itemName", e.target.value)}
                      className={inputClass}
                      placeholder={item.isCustom ? "Custom item" : "Selected item name"}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemFieldChange(index, "quantity", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Price
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.finalUnitPrice}
                      onChange={(e) => handleItemFieldChange(index, "finalUnitPrice", e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      Subtotal
                    </label>
                    <div className="flex h-[42px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>

                {(item.productServiceId || item.isCustom) && (
                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        Price Adjustment Reason
                      </label>
                      <input
                        type="text"
                        value={item.priceAdjustmentReason || ""}
                        onChange={(e) => handleItemFieldChange(index, "priceAdjustmentReason", e.target.value)}
                        className={inputClass}
                        placeholder={
                          Math.abs(item.finalUnitPrice - item.basePrice) > 0.001
                            ? "Why was the price adjusted?"
                            : "Optional"
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        Category
                      </label>
                      <div className="relative">
                        <select
                          value={item.category}
                          onChange={(e) => handleItemFieldChange(index, "category", e.target.value)}
                          className={cn(inputClass, "appearance-none pr-10")}
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Field label="Notes / Special Instructions">
          <textarea
            ref={notesRef}
            rows={3}
            className={inputClass}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes for production or delivery"
          />
        </Field>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Total</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{formatCurrency(totalOrderAmount)}</p>
            <p className="text-xs text-slate-500">{totalQuantity} total units</p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button ref={submitBtnRef} type="submit">
              <Plus className="h-4 w-4" /> Confirm & Forward to Production
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
