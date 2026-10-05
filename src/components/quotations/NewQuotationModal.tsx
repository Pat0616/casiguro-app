import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  Image as ImageIcon,
  Phone,
  Plus,
  Save,
  ShoppingCart,
  Send,
  Trash2,
  User,
} from "lucide-react";
import type { CatalogItem, Quotation, QuotationItem } from "@/types";
import { getCatalogItems } from "@/utils/catalogAPI";
import { createQuotation, type NewQuotationPayload } from "@/utils/quotationAPI";
import { getCustomers, type CustomerSuggestion } from "@/utils/customerAPI";
import { formatCurrency } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import CatalogShoppingGrid from "@/components/catalog/CatalogShoppingGrid";
import ShoppingCartPanel from "@/components/catalog/ShoppingCartPanel";

interface NewQuotationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (quotation: Quotation) => void;
}

const defaultValidityDays = 14;
type QuotationCartItem = QuotationItem & { tempId: string };

function makeCartItem(): QuotationCartItem {
  return {
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
  };
}

function getDefaultValidityDate() {
  const date = new Date();
  date.setDate(date.getDate() + defaultValidityDays);
  return date.toISOString().slice(0, 10);
}

export default function NewQuotationModal({ open, onClose, onCreated }: NewQuotationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [validUntil, setValidUntil] = useState(getDefaultValidityDate);
  const [notes, setNotes] = useState("");
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerContainerRef = useRef<HTMLDivElement>(null);
  const customerNameRef = useRef<HTMLInputElement>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [items, setItems] = useState<QuotationCartItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [dependencyError, setDependencyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingCatalog(true);
    setDependencyError(null);
    Promise.all([getCatalogItems({ includeInactive: false }), getCustomers()])
      .then(([catalog, customerList]) => {
        setCatalogItems(catalog);
        setCustomers(customerList);
      })
      .catch((error: unknown) => {
        console.error("Error loading quotation dependencies:", error);
        setDependencyError(error instanceof Error ? error.message : "Could not load the catalog and customer list.");
      })
      .finally(() => setLoadingCatalog(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
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
          customerName.trim() &&
          customer.name.toLowerCase().includes(customerName.trim().toLowerCase())
      ),
    [customers, customerName]
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
  const totalQuotationAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQuotationQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSelectCustomer = (customer: CustomerSuggestion) => {
    setCustomerName(customer.name);
    if (customer.contactNumber) setContactNumber(customer.contactNumber);
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
          ...makeCartItem(),
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

  const handleChangeItem = (
    tempId: string,
    field: "itemName" | "category" | "quantity" | "finalUnitPrice" | "priceAdjustmentReason",
    value: string
  ) => {
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
      if (!item.isCustom && item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001 && !item.priceAdjustmentReason?.trim()) {
        setFormError(`Add a price adjustment reason for ${item.itemName}.`);
        return;
      }
    }
    setFormError(null);
    setStep(2);
    setTimeout(() => customerNameRef.current?.focus(), 80);
  };

  const handleSubmit = async (submitStatus: "draft" | "sent") => {
    setFormError(null);
    if (!customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }
    if (!validUntil) {
      setFormError("Quotation validity date is required.");
      return;
    }
    if (items.length === 0) {
      setFormError("Add at least one line item.");
      setStep(1);
      return;
    }
    for (const [index, item] of items.entries()) {
      if (!item.itemName.trim()) {
        setFormError(`Add a name for item #${index + 1}.`);
        setStep(1);
        return;
      }
      if (!item.isCustom && item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001 && !item.priceAdjustmentReason?.trim()) {
        setFormError(`Add a price adjustment reason for ${item.itemName}.`);
        setStep(1);
        return;
      }
    }

    try {
      setSaving(true);
      const payload: NewQuotationPayload = {
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim() || undefined,
        validUntil,
        notes: notes.trim() || undefined,
        status: submitStatus,
        items: items.map((item) => ({
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
              ? item.priceAdjustmentReason?.trim() || null
              : null,
          subtotal: item.subtotal,
        })),
      };
      const created = await createQuotation(payload);
      onCreated(created);
      onClose();
      setStep(1);
      setItems([]);
      setCustomerName("");
      setContactNumber("");
      setNotes("");
      setValidUntil(getDefaultValidityDate());
      setFormError(null);
    } catch (error: unknown) {
      console.error("Create quotation error:", error);
      setFormError(error instanceof Error ? error.message : "Failed to create quotation");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setStep(1);
    setMobileCartOpen(false);
    setFormError(null);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid h-dvh w-screen place-items-center overflow-hidden bg-black/40 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative z-10 flex h-full w-full max-w-none flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:p-6">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Create Enterprise Quotation</h2>
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">Multi-item proposal</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">Select catalog items and set pricing before adding customer details.</p>
          </div>
          <button type="button" onClick={handleClose} disabled={saving} aria-label="Close quotation" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50">✕</button>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 py-3">
          {[["1", "Choose items"], ["2", "Quotation details"]].map(([number, label], index) => {
            const active = step === index + 1;
            const complete = step > index + 1;
            return (
              <div key={number} className="flex flex-1 items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active || complete ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"}`}>{complete ? <Check className="h-4 w-4" /> : number}</span>
                <span className={`text-sm font-semibold ${active ? "text-sky-700" : "text-slate-500"}`}>{label}</span>
                {index === 0 && <span className="h-px flex-1 bg-slate-200" />}
              </div>
            );
          })}
        </div>

        {formError && <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</div>}
        {dependencyError && <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{dependencyError}</div>}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden py-3">
          {step === 1 ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5">
              <div className="min-h-0 flex-1 overflow-y-auto pr-1 lg:flex-none">
                <CatalogShoppingGrid items={catalogItems} loading={loadingCatalog} cartCounts={cartCounts} onAdd={handleAddCatalogItem} />
              </div>
              <div className="hidden min-h-0 lg:block">
                <ShoppingCartPanel
                  className="h-full"
                  items={items}
                  catalogItems={catalogItems}
                  totalQuantity={totalQuotationQuantity}
                  totalAmount={totalQuotationAmount}
                  onAddCustom={() => setItems((prev) => [...prev, makeCartItem()])}
                  onChange={handleChangeItem}
                  onRemove={(tempId) => setItems((prev) => prev.filter((item) => item.tempId !== tempId))}
                  onContinue={handleContinue}
                  continueLabel="Quotation details"
                />
              </div>
              <section className="hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Your cart <span className="text-slate-400">({items.length})</span></h3>
                    <p className="text-xs text-slate-500">Confirm quantities, adjusted prices, and reasons before continuing.</p>
                  </div>
                  <button type="button" onClick={() => setItems((prev) => [...prev, makeCartItem()])} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"><Plus className="h-3.5 w-3.5" />Add custom item</button>
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
                                    <select value={item.category || "General"} onChange={(event) => handleChangeItem(item.tempId, "category", event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                      {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                                    </select>
                                  </div>
                                ) : <p className="font-semibold text-slate-900">{item.itemName}</p>}
                                <p className="mt-1 text-xs text-slate-500">{item.isCustom ? "Custom item" : <>{item.itemType === "service" && <Briefcase className="mr-1 inline h-3 w-3" />}{item.itemType === "service" ? "Service" : "Product"} · Base {formatCurrency(item.basePrice)}</>}</p>
                              </div>
                              <button type="button" onClick={() => setItems((prev) => prev.filter((line) => line.tempId !== item.tempId))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${item.itemName || "custom item"}`}><Trash2 className="h-4 w-4" /></button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <label className="text-xs font-semibold text-slate-600">Quantity<input type="number" min="1" value={item.quantity} onChange={(event) => handleChangeItem(item.tempId, "quantity", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" /></label>
                              <label className="text-xs font-semibold text-slate-600">Final unit price<input type="number" min="0" step="0.01" value={item.finalUnitPrice} onChange={(event) => handleChangeItem(item.tempId, "finalUnitPrice", event.target.value)} className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${adjusted ? "border-amber-400 bg-amber-50" : "border-slate-200"}`} /></label>
                              <div className="text-xs font-semibold text-slate-600">Subtotal<p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p></div>
                            </div>
                            {adjusted && <label className="block text-xs font-semibold text-amber-800">Price adjustment reason<input value={item.priceAdjustmentReason || ""} onChange={(event) => handleChangeItem(item.tempId, "priceAdjustmentReason", event.target.value)} placeholder="Required when price differs from catalog price" className="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm" /></label>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="sticky bottom-0 z-10 -mx-2 flex items-center justify-between gap-2 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden">
                <button type="button" onClick={() => setMobileCartOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700">
                  <ShoppingCart className="h-4 w-4" /> Cart ({items.length}) · {formatCurrency(totalQuotationAmount)}
                </button>
                <button type="button" onClick={handleContinue} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">Continue →</button>
              </div>

              {mobileCartOpen && (
                <div className="fixed inset-0 z-[70] bg-slate-900/50 p-3 lg:hidden">
                  <div className="mx-auto flex h-full max-w-lg flex-col">
                    <ShoppingCartPanel
                      className="flex-1"
                      items={items}
                      catalogItems={catalogItems}
                      totalQuantity={totalQuotationQuantity}
                      totalAmount={totalQuotationAmount}
                      onAddCustom={() => setItems((prev) => [...prev, makeCartItem()])}
                      onChange={handleChangeItem}
                      onRemove={(tempId) => setItems((prev) => prev.filter((item) => item.tempId !== tempId))}
                      onContinue={() => {
                        setMobileCartOpen(false);
                        handleContinue();
                      }}
                      continueLabel="Quotation details"
                      onClose={() => setMobileCartOpen(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5">
                <div ref={customerContainerRef} className="relative">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Customer name <span className="text-rose-500">*</span></label>
                  <div className="relative"><User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input ref={customerNameRef} value={customerName} onChange={(event) => { setCustomerName(event.target.value); setShowCustomerSuggestions(true); }} onFocus={() => customerName.trim() && setShowCustomerSuggestions(true)} placeholder="e.g. Maria Santos" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" /></div>
                  {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{filteredCustomerSuggestions.map((customer) => <button key={customer.id || customer.name} type="button" onClick={() => handleSelectCustomer(customer)} className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sky-50"><span>{customer.name}</span><span className="text-xs text-slate-400">{customer.contactNumber}</span></button>)}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Contact number</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={contactNumber} onChange={(event) => setContactNumber(event.target.value)} placeholder="e.g. 0917-123-4567" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" /></div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Valid until <span className="text-rose-500">*</span></label>
                  <div className="relative"><Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" /></div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Quotation notes & scope of work</label>
                  <textarea rows={4} placeholder="Terms, delivery conditions, artwork approval timeline, payment stipulations..." value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
              </div>
              <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">Quotation summary</h3>
                <div className="mt-3 space-y-2 border-b border-slate-200 pb-3">
                  {items.map((item) => <div key={item.tempId} className="flex justify-between gap-3 text-xs"><span className="line-clamp-1 text-slate-600">{item.quantity} × {item.itemName}</span><span className="shrink-0 font-semibold text-slate-800">{formatCurrency(item.subtotal)}</span></div>)}
                </div>
                <div className="mt-3 flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(totalQuotationAmount)}</span></div>
                <p className="mt-1 text-xs text-slate-500">{totalQuotationQuantity} total units</p>
                <button type="button" onClick={() => setStep(1)} className="mt-4 text-xs font-semibold text-sky-700 hover:text-sky-800">← Back to cart</button>
              </aside>
            </div>
          )}
        </div>

        {step === 2 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div><span className="text-xs text-slate-500">{totalQuotationQuantity} total units · Quotation total</span><p className="font-mono text-lg font-extrabold text-sky-700">{formatCurrency(totalQuotationAmount)}</p></div>
            <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={handleClose} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="button" onClick={() => handleSubmit("draft")} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Save className="h-4 w-4" />Save draft</button><button type="button" onClick={() => handleSubmit("sent")} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"><Send className="h-4 w-4" />{saving ? "Processing..." : "Save & send"}</button></div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
