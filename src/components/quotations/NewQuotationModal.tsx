// casiguro-app/src/components/quotations/NewQuotationModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Boxes,
  Briefcase,
  FileText,
  Send,
  Save,
  ChevronDown,
  Check,
  Percent,
} from "lucide-react";
import type { CatalogItem, Quotation, QuotationItem } from "@/types";
import { getCatalogItems } from "@/utils/catalogAPI";
import { createQuotation, type NewQuotationPayload } from "@/utils/quotationAPI";
import { getCustomers, type CustomerSuggestion } from "@/utils/customerAPI";
import { CATEGORIES } from "@/lib/constants";

function formatCurrency(n: number) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface NewQuotationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (quotation: Quotation) => void;
}

const defaultValidityDays = 14;

export default function NewQuotationModal({ open, onClose, onCreated }: NewQuotationModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + defaultValidityDays);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");

  // Customer suggestions
  const [customers, setCustomers] = useState<CustomerSuggestion[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerHighlightIndex, setCustomerHighlightIndex] = useState(-1);
  const customerContainerRef = useRef<HTMLDivElement>(null);

  // Catalog items
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Line items
  const [items, setItems] = useState<
    (QuotationItem & { tempId: string })[]
  >([
    {
      tempId: "item-1",
      productServiceId: null,
      itemName: "",
      itemDescription: "",
      category: "General",
      itemType: "product",
      isCustom: false,
      quantity: 1,
      basePrice: 0,
      finalUnitPrice: 0,
      priceAdjustmentReason: "",
      subtotal: 0,
    },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load catalog and customer suggestions when modal opens
  useEffect(() => {
    if (open) {
      setLoadingCatalog(true);
      Promise.all([getCatalogItems({ includeInactive: false }), getCustomers()])
        .then(([cats, custs]) => {
          setCatalogItems(cats);
          setCustomers(custs);
        })
        .catch((err) => console.error("Error loading quote dependencies:", err))
        .finally(() => setLoadingCatalog(false));
    }
  }, [open]);

  // Click outside for customer dropdown
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

  const filteredCustomerSuggestions = customers.filter(
    (c) =>
      customerName.trim() &&
      c.name.toLowerCase().includes(customerName.trim().toLowerCase())
  );

  const handleSelectCustomer = (c: CustomerSuggestion) => {
    setCustomerName(c.name);
    if (c.contactNumber) {
      setContactNumber(c.contactNumber);
    }
    setShowCustomerSuggestions(false);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productServiceId: null,
        itemName: "",
        itemDescription: "",
        category: "General",
        itemType: "product",
        isCustom: false,
        quantity: 1,
        basePrice: 0,
        finalUnitPrice: 0,
        priceAdjustmentReason: "",
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCatalogSelection = (index: number, catalogId: string) => {
    const found = catalogItems.find((c) => c.id === catalogId);
    if (!found) return;

    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        const q = it.quantity || 1;
        return {
          ...it,
          productServiceId: found.id,
          itemName: found.name,
          itemDescription: found.description || "",
          category: found.categoryName || "General",
          itemType: found.type,
          isCustom: false,
          basePrice: found.basePrice,
          finalUnitPrice: found.basePrice,
          priceAdjustmentReason: "",
          subtotal: Number((q * found.basePrice).toFixed(2)),
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
          basePrice: isCustom ? 0 : it.basePrice,
          priceAdjustmentReason: isCustom ? "" : it.priceAdjustmentReason,
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
        const price = field === "finalUnitPrice" ? Math.max(0, Number(value) || 0) : updated.finalUnitPrice;
        updated.quantity = qty;
        updated.finalUnitPrice = price;
        updated.subtotal = Number((qty * price).toFixed(2));

        return updated;
      })
    );
  };

  const totalQuotationAmount = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
  const totalQuotationQuantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

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
      setFormError("At least one line item is required.");
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName.trim()) {
        setFormError(`Item #${i + 1} requires a valid item name.`);
        return;
      }
      if (it.quantity <= 0) {
        setFormError(`Item "${it.itemName}" must have a quantity of at least 1.`);
        return;
      }

      // MANDATORY PRICE ADJUSTMENT VALIDATION
      if (!it.isCustom && it.productServiceId) {
        if (Math.abs(it.finalUnitPrice - it.basePrice) > 0.001) {
          if (!it.priceAdjustmentReason || !it.priceAdjustmentReason.trim()) {
            setFormError(
              `Item #${i + 1} ("${it.itemName}") has a modified price (${formatCurrency(
                it.finalUnitPrice
              )} vs base ${formatCurrency(
                it.basePrice
              )}). A Price Adjustment Reason is strictly mandatory.`
            );
            return;
          }
        }
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
        items: items.map((it) => ({
          productServiceId: it.productServiceId,
          itemName: it.itemName.trim(),
          itemDescription: it.itemDescription?.trim() || undefined,
          category: it.category?.trim() || "General",
          itemType: it.itemType,
          isCustom: it.isCustom,
          quantity: it.quantity,
          basePrice: it.basePrice,
          finalUnitPrice: it.finalUnitPrice,
          priceAdjustmentReason:
            Math.abs(it.finalUnitPrice - it.basePrice) > 0.001 ? it.priceAdjustmentReason?.trim() : null,
          subtotal: it.subtotal,
        })),
      };

      const created = await createQuotation(payload);
      onCreated(created);
      onClose();
    } catch (err: any) {
      console.error("Create quotation error:", err);
      setFormError(err.message || "Failed to create quotation");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Enterprise Quotation</h2>
              <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                Multi-Item Proposal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft or send quotation proposals with reference base pricing snapshots and price adjustment governance.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {formError && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {formError}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* Customer & Quote Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            {/* Customer Name with Suggestion Box */}
            <div className="relative" ref={customerContainerRef}>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowCustomerSuggestions(true);
                  }}
                  onFocus={() => {
                    if (customerName.trim()) setShowCustomerSuggestions(true);
                  }}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                />
              </div>

              {/* Suggestions dropdown */}
              {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {filteredCustomerSuggestions.map((c, i) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 flex items-center justify-between group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-sky-700">{c.name}</span>
                      {c.contactNumber && <span className="text-slate-400 text-[11px]">{c.contactNumber}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 0917-123-4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>

            {/* Validity Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valid Until <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
                Quotation Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-sky-600" />
                Add Item
              </button>
            </div>

            {items.map((item, index) => {
              const isPriceAdjusted =
                !item.isCustom && item.productServiceId && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001;

              return (
                <div
                  key={item.tempId}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 relative group hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCustom}
                          onChange={(e) => handleToggleCustom(index, e.target.checked)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                        />
                        <span>Custom Non-Catalog Item</span>
                      </label>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                    {/* Catalog Selection or Custom Item Name */}
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {item.isCustom ? "Custom Item Name *" : "Select from Catalog *"}
                      </label>
                      {item.isCustom ? (
                        <input
                          type="text"
                          required
                          placeholder="e.g. Custom Acrylic Event Trophy"
                          value={item.itemName}
                          onChange={(e) => handleItemFieldChange(index, "itemName", e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <select
                          value={item.productServiceId || ""}
                          onChange={(e) => handleCatalogSelection(index, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        >
                          <option value="">-- Choose Catalog Product / Service --</option>
                          {catalogItems.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              [{cat.type.toUpperCase()}] {cat.name} ({formatCurrency(cat.basePrice)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(index, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>

                    {/* Reference Base Price Snapshot */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Base Price
                      </label>
                      <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-mono font-medium text-slate-700">
                        {item.isCustom ? "Custom" : formatCurrency(item.basePrice)}
                      </div>
                    </div>

                    {/* Final Unit Price */}
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Final Unit Price (₱)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={item.finalUnitPrice}
                        onChange={(e) =>
                          handleItemFieldChange(index, "finalUnitPrice", parseFloat(e.target.value) || 0)
                        }
                        className={`w-full rounded-lg border px-3 py-1.5 text-xs font-mono font-semibold focus:outline-none focus:ring-1 ${
                          isPriceAdjusted
                            ? "border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-500 focus:ring-amber-400"
                            : "border-slate-200 text-slate-900 focus:border-sky-500 focus:ring-sky-500"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mandatory Price Adjustment Reason */}
                  {isPriceAdjusted && (
                    <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 animate-in fade-in duration-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        Price Adjustment Reason (Mandatory)*
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bulk discount 10%, rush fee, VIP partner rate, non-standard finishing..."
                        value={item.priceAdjustmentReason || ""}
                        onChange={(e) => handleItemFieldChange(index, "priceAdjustmentReason", e.target.value)}
                        className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs text-amber-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Subtotal preview */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">
                      {item.itemName || "Item"} × {item.quantity} units
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      Subtotal: {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes & Terms */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quotation Notes & Scope of Work</label>
            <textarea
              rows={2}
              placeholder="Terms, delivery conditions, artwork approval timeline, payment stipulations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Footer / Action Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-slate-500">Total Quantity:</span>
              <span className="ml-1 text-sm font-bold text-slate-800">{totalQuotationQuantity}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Quotation Total:</span>
              <span className="ml-1.5 text-base font-mono font-extrabold text-sky-700">
                {formatCurrency(totalQuotationAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("sent")}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {saving ? "Processing..." : "Save & Send Quotation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
