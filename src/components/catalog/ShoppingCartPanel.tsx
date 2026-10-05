import { Briefcase, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import type { CatalogItem } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

export interface ShoppingCartLine {
  tempId: string;
  productServiceId?: string | null;
  itemName: string;
  itemDescription?: string;
  category?: string;
  itemType: "product" | "service";
  isCustom: boolean;
  quantity: number;
  basePrice: number;
  finalUnitPrice: number;
  priceAdjustmentReason?: string | null;
  subtotal: number;
}

interface ShoppingCartPanelProps {
  items: ShoppingCartLine[];
  catalogItems: CatalogItem[];
  totalQuantity: number;
  totalAmount: number;
  onAddCustom: () => void;
  onChange: (
    tempId: string,
    field: "itemName" | "category" | "quantity" | "finalUnitPrice" | "priceAdjustmentReason",
    value: string
  ) => void;
  onRemove: (tempId: string) => void;
  onContinue?: () => void;
  continueLabel?: string;
  emptyMessage?: string;
  className?: string;
  onClose?: () => void;
}

export default function ShoppingCartPanel({
  items,
  catalogItems,
  totalQuantity,
  totalAmount,
  onAddCustom,
  onChange,
  onRemove,
  onContinue,
  continueLabel = "Continue",
  emptyMessage = "Add a product or service to start your order.",
  className,
  onClose,
}: ShoppingCartPanelProps) {
  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
        <div>
          <h3 className="font-bold text-slate-900">Your cart <span className="text-slate-400">({items.length})</span></h3>
          <p className="mt-0.5 text-xs text-slate-500">Review items, quantities, and pricing.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close cart" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onAddCustom}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Custom
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          items.map((item) => {
            const catalogItem = catalogItems.find((catalog) => catalog.id === item.productServiceId);
            const adjusted = !item.isCustom && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001;
            return (
              <article key={item.tempId} className="rounded-xl border border-slate-200 p-3">
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {catalogItem?.imageUrl ? (
                      <img src={catalogItem.imageUrl} alt={item.itemName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      {item.isCustom ? (
                        <input
                          value={item.itemName}
                          onChange={(event) => onChange(item.tempId, "itemName", event.target.value)}
                          placeholder="Custom item name"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold"
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.itemName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {item.itemType === "service" && <Briefcase className="mr-1 inline h-3 w-3" />}
                            {item.itemType === "service" ? "Service" : "Product"} · Base {formatCurrency(item.basePrice)}
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemove(item.tempId)}
                        aria-label={`Remove ${item.itemName || "custom item"}`}
                        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {item.isCustom && (
                      <select
                        value={item.category || "General"}
                        onChange={(event) => onChange(item.tempId, "category", event.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600"
                      >
                        {["General", ...CATEGORIES].map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Quantity
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => onChange(item.tempId, "quantity", event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-slate-600">
                    Unit price
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.finalUnitPrice}
                      onChange={(event) => onChange(item.tempId, "finalUnitPrice", event.target.value)}
                      className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${adjusted ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}
                    />
                  </label>
                </div>
                {adjusted && (
                  <label className="mt-2 block text-[11px] font-semibold text-amber-800">
                    Price adjustment reason
                    <input
                      value={item.priceAdjustmentReason || ""}
                      onChange={(event) => onChange(item.tempId, "priceAdjustmentReason", event.target.value)}
                      placeholder="Required for adjusted catalog prices"
                      className="mt-1 w-full rounded-lg border border-amber-300 px-2 py-1.5 text-xs"
                    />
                  </label>
                )}
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-500">{item.quantity} × {formatCurrency(item.finalUnitPrice)}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{totalQuantity} total units</p>
            <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalAmount)}</p>
          </div>
          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {continueLabel} →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
