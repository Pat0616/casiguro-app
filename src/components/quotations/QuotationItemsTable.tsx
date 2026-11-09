import { Fragment } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import type { ShoppingCartLine } from "@/components/catalog/ShoppingCartPanel";
import { withCurrent } from "@/utils/categoryAPI";
import { cn, formatCurrency } from "@/lib/utils";
import { MOBILE_CARD_LIST } from "@/lib/constants";
import PriceInput from "@/components/ui/PriceInput";
import QuantityInput from "@/components/ui/QuantityInput";

type EditableField = "itemName" | "category" | "quantity" | "finalUnitPrice" | "priceAdjustmentReason";

interface QuotationItemsTableProps {
  items: ShoppingCartLine[];
  // Options for a custom line's category ("General" first), from categoryOptionNames()
  categoryNames: string[];
  totalQuantity: number;
  totalAmount: number;
  onChange: (tempId: string, field: EditableField, value: string) => void;
  onRemove: (tempId: string) => void;
  onAddCustom: () => void;
}

// Inputs look like plain document text until hovered or focused
const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-slate-900 transition hover:border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function QuotationItemsTable({ items, categoryNames, totalQuantity, totalAmount, onChange, onRemove, onAddCustom }: QuotationItemsTableProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Quotation Items</h3>
          <p className="text-xs text-slate-500">Add items from the catalog, or add a custom line for work that isn't in the catalog.</p>
        </div>
        <button
          type="button"
          onClick={onAddCustom}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Custom line
        </button>
      </div>

      {/* Phones: one editable card per line instead of a sideways-scrolling table */}
      <div className="min-h-0 flex-1 overflow-auto md:hidden">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            No items yet. Choose products or services from the catalog, or add a custom line.
          </p>
        ) : (
          <ol className={MOBILE_CARD_LIST}>
            {items.map((item, index) => {
              const adjusted = !item.isCustom && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001;
              const needsReason = adjusted && !item.priceAdjustmentReason?.trim();
              return (
                <li key={item.tempId} className="space-y-2 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-5 shrink-0 font-mono text-xs text-slate-400">{index + 1}.</span>
                    <div className="min-w-0 flex-1">
                      {item.isCustom ? (
                        <div className="space-y-1">
                          <input
                            value={item.itemName}
                            onChange={(event) => onChange(item.tempId, "itemName", event.target.value)}
                            placeholder="Describe the item or service"
                            aria-label={`Item ${index + 1} description`}
                            className={cn(cellInput, "border-slate-200 bg-white font-semibold")}
                          />
                          <select
                            value={item.category || "General"}
                            onChange={(event) => onChange(item.tempId, "category", event.target.value)}
                            aria-label={`Item ${index + 1} category`}
                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600 focus:border-sky-500 focus:outline-none"
                          >
                            {withCurrent(categoryNames, item.category).map((category) => <option key={category} value={category}>{category}</option>)}
                          </select>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-900">{item.itemName}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.category || "General"} · {item.itemType === "service" ? "Service" : "Product"}
                            {item.selectedVariant && ` · ${item.selectedVariant}`}
                          </p>
                        </>
                      )}
                      {item.isCustom && item.selectedVariant && <p className="mt-1 text-[11px] text-slate-500">{item.selectedVariant}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.tempId)}
                      aria-label={`Remove item ${index + 1}`}
                      className="shrink-0 rounded-md p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[5rem_1fr] gap-2 pl-7">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Qty
                      <QuantityInput
                        value={item.quantity}
                        onChange={(quantity) => onChange(item.tempId, "quantity", String(quantity))}
                        aria-label={`Item ${index + 1} quantity`}
                        className={cn(cellInput, "mt-0.5 border-slate-200 bg-white text-center font-mono")}
                      />
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Unit price
                      <PriceInput
                        value={item.finalUnitPrice}
                        onChange={(price) => onChange(item.tempId, "finalUnitPrice", String(price))}
                        aria-label={`Item ${index + 1} unit price`}
                        className={cn(cellInput, "mt-0.5 border-slate-200 bg-white text-right font-mono", adjusted && "border-amber-300 bg-amber-50")}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between pl-7 text-xs">
                    <span className="text-slate-400">{adjusted && <span className="line-through">{formatCurrency(item.basePrice)}</span>}</span>
                    <span>
                      <span className="text-slate-500">Amount </span>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(item.subtotal)}</span>
                    </span>
                  </div>

                  {adjusted && (
                    <label className="ml-7 block rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Price changed from catalog — reason:
                      </span>
                      <input
                        value={item.priceAdjustmentReason || ""}
                        onChange={(event) => onChange(item.tempId, "priceAdjustmentReason", event.target.value)}
                        placeholder="e.g. bulk discount, rush fee (internal, not printed)"
                        className={cn(
                          "mt-1 w-full rounded border bg-white px-2 py-1.5 text-xs font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-400",
                          needsReason ? "border-amber-400" : "border-amber-200"
                        )}
                      />
                    </label>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3 border-t-2 border-slate-300 bg-slate-50 px-4 py-3 md:hidden">
          <span className="text-xs text-slate-500">
            {items.length} line{items.length === 1 ? "" : "s"} · {totalQuantity} pcs
          </span>
          <span className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Total Amount</span>
            <span className="font-mono text-base font-extrabold text-slate-900">{formatCurrency(totalAmount)}</span>
          </span>
        </div>
      )}

      <div className="hidden min-h-0 flex-1 overflow-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <th className="w-12 px-3 py-2.5 text-center">No.</th>
              <th className="px-3 py-2.5 text-left">Item / Description</th>
              <th className="w-36 px-3 py-2.5 text-left">Size / Option</th>
              <th className="w-24 px-3 py-2.5 text-center">Qty</th>
              <th className="w-36 px-3 py-2.5 text-right">Unit Price</th>
              <th className="w-36 px-3 py-2.5 text-right">Amount</th>
              <th className="w-10 px-2 py-2.5"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                  No items yet. Choose products or services from the catalog, or add a custom line.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const adjusted = !item.isCustom && Math.abs(item.finalUnitPrice - item.basePrice) > 0.001;
                const needsReason = adjusted && !item.priceAdjustmentReason?.trim();
                return (
                  <Fragment key={item.tempId}>
                    <tr className={cn("align-top", !adjusted && "border-b border-slate-100")}>
                      <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-500">{index + 1}</td>
                      <td className="px-3 py-1.5">
                        {item.isCustom ? (
                          <div className="space-y-1">
                            <input
                              value={item.itemName}
                              onChange={(event) => onChange(item.tempId, "itemName", event.target.value)}
                              placeholder="Describe the item or service"
                              aria-label={`Item ${index + 1} description`}
                              className={cn(cellInput, "font-semibold", !item.itemName.trim() && "border-slate-200 bg-white")}
                            />
                            <select
                              value={item.category || "General"}
                              onChange={(event) => onChange(item.tempId, "category", event.target.value)}
                              aria-label={`Item ${index + 1} category`}
                              className="rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[11px] text-slate-500 hover:border-slate-200 focus:border-sky-500 focus:outline-none"
                            >
                              {withCurrent(categoryNames, item.category).map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="px-2 py-1">
                            <p className="font-semibold text-slate-900">{item.itemName}</p>
                            <p className="text-[11px] text-slate-500">
                              {item.category || "General"} · {item.itemType === "service" ? "Service" : "Product"}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{item.selectedVariant || <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-1.5">
                        <QuantityInput
                          value={item.quantity}
                          onChange={(quantity) => onChange(item.tempId, "quantity", String(quantity))}
                          aria-label={`Item ${index + 1} quantity`}
                          className={cn(cellInput, "text-center font-mono")}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <PriceInput
                          value={item.finalUnitPrice}
                          onChange={(price) => onChange(item.tempId, "finalUnitPrice", String(price))}
                          aria-label={`Item ${index + 1} unit price`}
                          className={cn(cellInput, "text-right font-mono", adjusted && "border-amber-300 bg-amber-50")}
                        />
                        {adjusted && (
                          <p className="mt-0.5 pr-2 text-right text-[10px] text-slate-400 line-through">{formatCurrency(item.basePrice)}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">{formatCurrency(item.subtotal)}</td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => onRemove(item.tempId)}
                          aria-label={`Remove item ${index + 1}`}
                          className="rounded-md p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {adjusted && (
                      <tr className="border-b border-slate-100">
                        <td />
                        <td colSpan={5} className="px-3 pb-2.5">
                          <label className="flex items-center gap-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="shrink-0">Price changed from catalog — reason:</span>
                            <input
                              value={item.priceAdjustmentReason || ""}
                              onChange={(event) => onChange(item.tempId, "priceAdjustmentReason", event.target.value)}
                              placeholder="e.g. bulk discount, rush fee (internal, not printed)"
                              className={cn(
                                "min-w-0 flex-1 rounded border bg-white px-2 py-1 text-xs font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-400",
                                needsReason ? "border-amber-400" : "border-amber-200"
                              )}
                            />
                          </label>
                        </td>
                        <td />
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-slate-50">
                <td colSpan={3} className="px-3 py-3 text-xs text-slate-500">
                  {items.length} line{items.length === 1 ? "" : "s"}
                </td>
                <td className="px-3 py-3 text-center font-mono text-xs font-semibold text-slate-700">{totalQuantity}</td>
                <td className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-700">Total Amount</td>
                <td className="px-3 py-3 text-right font-mono text-base font-extrabold text-slate-900">{formatCurrency(totalAmount)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
