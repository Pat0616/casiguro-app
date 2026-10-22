import { Fragment } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import type { ShoppingCartLine } from "@/components/catalog/ShoppingCartPanel";
import { CATEGORIES } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";

type EditableField = "itemName" | "category" | "quantity" | "finalUnitPrice" | "priceAdjustmentReason";

interface QuotationItemsTableProps {
  items: ShoppingCartLine[];
  totalQuantity: number;
  totalAmount: number;
  onChange: (tempId: string, field: EditableField, value: string) => void;
  onRemove: (tempId: string) => void;
  onAddCustom: () => void;
}

// Inputs look like plain document text until hovered or focused
const cellInput =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-slate-900 transition hover:border-slate-200 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500";

export default function QuotationItemsTable({ items, totalQuantity, totalAmount, onChange, onRemove, onAddCustom }: QuotationItemsTableProps) {
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

      <div className="min-h-0 flex-1 overflow-auto">
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
                              {["General", ...CATEGORIES].map((category) => <option key={category} value={category}>{category}</option>)}
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
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => onChange(item.tempId, "quantity", event.target.value)}
                          aria-label={`Item ${index + 1} quantity`}
                          className={cn(cellInput, "text-center font-mono")}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.finalUnitPrice}
                          onChange={(event) => onChange(item.tempId, "finalUnitPrice", event.target.value)}
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
