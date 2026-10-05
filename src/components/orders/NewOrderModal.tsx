import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  Factory,
  Image as ImageIcon,
  PackageCheck,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import { cn, formatCurrency, isoDate } from "@/lib/utils";
import { CATEGORIES, NOW } from "@/lib/constants";
import type { CatalogItem, NewOrderFormData, OrderType } from "@/types";
import Modal from "@/components/ui/Modal";
import Field, { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import CatalogShoppingGrid from "@/components/catalog/CatalogShoppingGrid";
import ShoppingCartPanel from "@/components/catalog/ShoppingCartPanel";
import { getCustomers, type CustomerSuggestion } from "@/utils/customerAPI";
import { getCatalogItems } from "@/utils/catalogAPI";

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewOrderFormData) => void;
}

interface OrderLineItem {
  tempId: string;
  productServiceId: string | null;
  itemName: string;
  itemDescription: string;
  category: string;
  itemType: "product" | "service";
  isCustom: boolean;
  quantity: number;
  basePrice: number;
  finalUnitPrice: number;
  priceAdjustmentReason: string;
  subtotal: number;
}

const makeEmptyItem = (): OrderLineItem => ({
  tempId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  productServiceId: null,
  itemName: "",
  itemDescription: "",
  category: "General",
  itemType: "product",
  isCustom: true,
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
  const [step, setStep] = useState<1 | 2>(1);
  const [orderType, setOrderType] = useState<OrderType>("custom");
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const customerContainerRef = useRef<HTMLDivElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setLoadingCatalog(true);
    Promise.all([getCatalogItems({ includeInactive: false }), getCustomers()])
      .then(([catalog, customerList]) => {
        setCatalogItems(catalog);
        setCustomers(customerList);
      })
      .catch((err) => {
        console.error("Error loading order dependencies:", err);
        setFormError(err instanceof Error ? err.message : "Failed to load products and customers.");
      })
      .finally(() => setLoadingCatalog(false));
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomerSuggestions = useMemo(
    () =>
      customers.filter(
        (customer) =>
          form.customerName.trim() &&
          customer.name.toLowerCase().includes(form.customerName.trim().toLowerCase())
      ),
    [customers, form.customerName]
  );

  const cartCounts = useMemo(
    () =>
      items.reduce<Record<string, number>>((counts, item) => {
        if (item.productServiceId) {
          counts[item.productServiceId] = (counts[item.productServiceId] || 0) + item.quantity;
        }
        return counts;
      }, {}),
    [items]
  );
  const totalOrderAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      contactNumber: customer.contactNumber || prev.contactNumber,
    }));
    setShowCustomerSuggestions(false);
  };

  const handleAddCatalogItem = (catalogItem: CatalogItem) => {
    const basePrice = Number(catalogItem.basePrice || catalogItem.defaultUnitPrice || 0);
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productServiceId === catalogItem.id);
      if (existingIndex >= 0) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1, subtotal: Number(((item.quantity + 1) * item.finalUnitPrice).toFixed(2)) }
            : item
        );
      }
      return [
        ...prev,
        {
          ...makeEmptyItem(),
          productServiceId: catalogItem.id,
          itemName: catalogItem.name,
          itemDescription: catalogItem.description || "",
          category: catalogItem.categoryName || "General",
          itemType: catalogItem.type,
          isCustom: false,
          basePrice,
          finalUnitPrice: basePrice,
          subtotal: basePrice,
        },
      ];
    });
    setFormError(null);
  };

  const handleChangeItem = (tempId: string, field: "itemName" | "category" | "quantity" | "finalUnitPrice" | "priceAdjustmentReason", value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const quantity = field === "quantity" ? Math.max(1, Number(value) || 1) : item.quantity;
        const finalUnitPrice = field === "finalUnitPrice" ? Math.max(0, Number(value) || 0) : item.finalUnitPrice;
        return {
          ...item,
          [field]: field === "quantity" || field === "finalUnitPrice" ? Number(value) : value,
          quantity,
          finalUnitPrice,
          subtotal: Number((quantity * finalUnitPrice).toFixed(2)),
        };
      })
    );
  };

  const handleContinue = () => {
    if (items.length === 0) {
      setFormError("Add at least one product or service to continue.");
      return;
    }
    for (const [index, item] of items.entries()) {
      if (!item.itemName.trim()) {
        setFormError(`Add a name for item #${index + 1}.`);
        return;
      }
      if (item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001 && !item.priceAdjustmentReason.trim()) {
        setFormError(`Add a price adjustment reason for ${item.itemName}.`);
        return;
      }
    }
    setFormError(null);
    setStep(2);
    setTimeout(() => customerNameRef.current?.focus(), 80);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!form.customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }
    if (!form.dueDate) {
      setFormError("Due date is required.");
      return;
    }
    const mappedItems = items.map((item) => ({
      productServiceId: item.productServiceId,
      itemName: item.itemName.trim(),
      itemDescription: item.itemDescription.trim() || undefined,
      category: item.category.trim() || "General",
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
      product: mappedItems.map((item) => item.itemName).join(", "),
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
    setItems([]);
    setOrderType("custom");
    setStep(1);
    setFormError(null);
    onClose();
  };

  const handleClose = () => {
    setStep(1);
    setMobileCartOpen(false);
    setFormError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Direct Order"
      subtitle="Build the customer's cart first, then enter the order details."
      wide
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          {[["1", "Choose items"], ["2", "Order details"]].map(([number, label], index) => {
            const active = step === index + 1;
            const complete = step > index + 1;
            return (
              <div key={number} className="flex flex-1 items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active || complete ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                }`}>{complete ? <Check className="h-4 w-4" /> : number}</span>
                <span className={`text-sm font-semibold ${active ? "text-sky-700" : "text-slate-500"}`}>{label}</span>
                {index === 0 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            );
          })}
        </div>

        {formError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4 lg:grid lg:h-[calc(94vh-290px)] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
            <div className="min-h-0 lg:overflow-y-auto lg:pr-2">
              <CatalogShoppingGrid
                items={catalogItems}
                loading={loadingCatalog}
                cartCounts={cartCounts}
                onAdd={handleAddCatalogItem}
              />
            </div>
            <div className="hidden min-h-0 lg:block">
              <ShoppingCartPanel
                items={items}
                catalogItems={catalogItems}
                totalQuantity={totalQuantity}
                totalAmount={totalOrderAmount}
                onAddCustom={() => setItems((prev) => [...prev, makeEmptyItem()])}
                onChange={handleChangeItem}
                onRemove={(tempId) => setItems((prev) => prev.filter((item) => item.tempId !== tempId))}
                onContinue={handleContinue}
                continueLabel="Order details"
              />
            </div>

            <section className="hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">Your cart <span className="text-slate-400">({items.length})</span></h3>
                  <p className="text-xs text-slate-500">Set quantities and final unit prices before continuing.</p>
                </div>
                <button type="button" onClick={() => setItems((prev) => [...prev, makeEmptyItem()])} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700">
                  <Plus className="h-3.5 w-3.5" /> Add custom item
                </button>
              </div>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Your cart is empty. Add a product or service to begin.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const catalogItem = catalogItems.find((catalog) => catalog.id === item.productServiceId);
                    const adjusted = !item.isCustom && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001;
                    return (
                      <div key={item.tempId} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[88px_minmax(0,1fr)_auto]">
                        <div className="h-20 w-full overflow-hidden rounded-lg bg-slate-100 sm:w-[88px]">
                          {catalogItem?.imageUrl ? <img src={catalogItem.imageUrl} alt={item.itemName} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="h-6 w-6" /></div>}
                        </div>
                        <div className="min-w-0 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {item.isCustom ? (
                                <div className="space-y-2">
                                  <input value={item.itemName} onChange={(event) => handleChangeItem(item.tempId, "itemName", event.target.value)} placeholder="Custom item name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold" />
                                  <select value={item.category} onChange={(event) => handleChangeItem(item.tempId, "category", event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <p className="font-semibold text-slate-900">{item.itemName}</p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">{item.isCustom ? "Custom item" : `${item.itemType === "service" ? "Service" : "Product"} · Base ${formatCurrency(item.basePrice)}`}</p>
                            </div>
                            <button type="button" onClick={() => setItems((prev) => prev.filter((line) => line.tempId !== item.tempId))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${item.itemName || "custom item"}`}><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <label className="text-xs font-semibold text-slate-600">Quantity<input type="number" min="1" value={item.quantity} onChange={(event) => handleChangeItem(item.tempId, "quantity", event.target.value)} className={cn(inputClass, "mt-1")} /></label>
                            <label className="text-xs font-semibold text-slate-600">Final unit price<input type="number" min="0" step="0.01" value={item.finalUnitPrice} onChange={(event) => handleChangeItem(item.tempId, "finalUnitPrice", event.target.value)} className={cn(inputClass, "mt-1", adjusted && "border-amber-400 bg-amber-50")} /></label>
                            <div className="text-xs font-semibold text-slate-600">Subtotal<p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p></div>
                          </div>
                          {adjusted && <label className="block text-xs font-semibold text-amber-800">Price adjustment reason<input value={item.priceAdjustmentReason} onChange={(event) => handleChangeItem(item.tempId, "priceAdjustmentReason", event.target.value)} placeholder="Required when price differs from catalog price" className="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm" /></label>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="hidden flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{totalQuantity} total units</p><p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalOrderAmount)}</p></div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button type="button" onClick={handleContinue}>Continue to order details <span aria-hidden="true">→</span></Button>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-2 flex items-center justify-between gap-2 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
              <button type="button" onClick={() => setMobileCartOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
                <ShoppingCart className="h-4 w-4" /> Cart ({items.length}) · {formatCurrency(totalOrderAmount)}
              </button>
              <Button type="button" onClick={handleContinue}>Continue <span aria-hidden="true">→</span></Button>
            </div>

            {mobileCartOpen && (
              <div className="fixed inset-0 z-[70] bg-slate-900/50 p-3 lg:hidden">
                <div className="mx-auto flex h-full max-w-lg flex-col">
                  <ShoppingCartPanel
                    className="flex-1"
                    items={items}
                    catalogItems={catalogItems}
                    totalQuantity={totalQuantity}
                    totalAmount={totalOrderAmount}
                    onAddCustom={() => setItems((prev) => [...prev, makeEmptyItem()])}
                    onChange={handleChangeItem}
                    onRemove={(tempId) => setItems((prev) => prev.filter((item) => item.tempId !== tempId))}
                    onContinue={() => {
                      setMobileCartOpen(false);
                      handleContinue();
                    }}
                    continueLabel="Order details"
                    onClose={() => setMobileCartOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5">
                <div ref={customerContainerRef} className="relative">
                  <Field label="Customer name">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input ref={customerNameRef} required value={form.customerName} onChange={(event) => { setForm((prev) => ({ ...prev, customerName: event.target.value })); setShowCustomerSuggestions(true); }} onFocus={() => form.customerName.trim() && setShowCustomerSuggestions(true)} placeholder="Customer name" autoComplete="off" className={cn(inputClass, "pl-9")} />
                    </div>
                  </Field>
                  {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                      {filteredCustomerSuggestions.map((customer) => <button key={customer.id || customer.name} type="button" onClick={() => handleSelectCustomer(customer)} className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sky-50"><span>{customer.name}</span><span className="text-xs text-slate-400">{customer.contactNumber}</span></button>)}
                    </div>
                  )}
                </div>

                <Field label="Contact number">
                  <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={form.contactNumber} onChange={(event) => setForm((prev) => ({ ...prev, contactNumber: event.target.value }))} placeholder="0917 000 0000" className={cn(inputClass, "pl-9")} /></div>
                </Field>

                <div>
                  <p className="mb-2 text-sm font-bold text-slate-800">Order type</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "custom" as const, label: "Custom order", description: "Requires production before completion.", Icon: Factory },
                      { key: "stock" as const, label: "Stock order", description: "Ready-made; completes immediately.", Icon: PackageCheck },
                    ].map(({ key, label, description, Icon }) => (
                      <button key={key} type="button" onClick={() => setOrderType(key)} className={cn("rounded-xl border p-4 text-left transition", orderType === key ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 hover:border-slate-300")}>
                        <Icon className={cn("mb-2 h-5 w-5", orderType === key ? "text-sky-600" : "text-slate-400")} /><p className="text-sm font-bold text-slate-800">{label}</p><p className="mt-0.5 text-xs text-slate-500">{description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Date ordered"><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" required value={form.dateOrdered} onChange={(event) => setForm((prev) => ({ ...prev, dateOrdered: event.target.value }))} className={cn(inputClass, "pl-9")} /></div></Field>
                  <Field label="Due date"><div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" required value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} className={cn(inputClass, "pl-9")} /></div></Field>
                </div>
                <Field label="Notes / special instructions"><textarea rows={4} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Optional notes for production or delivery" className={inputClass} /></Field>
              </div>

              <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Order summary</h3>
                <div className="mt-3 space-y-2 border-b border-slate-200 pb-3">
                  {items.map((item) => <div key={item.tempId} className="flex justify-between gap-3 text-xs"><span className="line-clamp-1 text-slate-600">{item.quantity} × {item.itemName}</span><span className="shrink-0 font-semibold text-slate-800">{formatCurrency(item.subtotal)}</span></div>)}
                </div>
                <div className="mt-3 flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(totalOrderAmount)}</span></div>
                <p className="mt-1 text-xs text-slate-500">{totalQuantity} total units</p>
                <button type="button" onClick={() => setStep(1)} className="mt-4 text-xs font-semibold text-sky-700 hover:text-sky-800">← Back to cart</button>
              </aside>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button type="submit"><Plus className="h-4 w-4" /> Confirm & forward to production</Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
