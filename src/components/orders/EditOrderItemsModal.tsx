// casiguro-app/src/components/orders/EditOrderItemsModal.tsx
// Revises an open order's lines when the customer adds something or the price changes (any employee).
// Add catalog or custom lines, change quantity / unit price, remove lines with no production yet.
// Saves on its own with a required reason; the server recomputes the total, balance and production status and
// refuses the save if the new total is below what's already paid, or if someone else changed the order (409).
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Boxes, Briefcase, Plus, RotateCcw, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import PriceInput from "@/components/ui/PriceInput";
import QuantityInput from "@/components/ui/QuantityInput";
import CatalogPickerPanel from "@/components/catalog/CatalogPickerPanel";
import { cn, formatCurrency } from "@/lib/utils";
import { getCatalogItems } from "@/utils/catalogAPI";
import { categoryOptionNames, getCategories, withCurrent } from "@/utils/categoryAPI";
import { getOrderById, updateOrderItems, type OrderItemEditLine } from "@/utils/orderAPI";
import type { CatalogItem, CatalogItemVariant, Order, OrderItem } from "@/types";

interface EditOrderItemsModalProps {
  order: Order | null;
  onClose: () => void;
  onSaved: (order: Order) => void;
}

interface Line {
  key: string;
  id?: string; // set for lines already on the order
  productServiceId: string | null;
  itemName: string;
  selectedVariant: string | null;
  itemDescription: string;
  category: string;
  itemType: "product" | "service";
  isCustom: boolean;
  quantity: number;
  basePrice: number;
  finalUnitPrice: number;
  priceAdjustmentReason: string;
  quantityCompleted: number;
  original?: OrderItem;
}

const cents = (n: number) => Math.round(n * 100);
const newKey = () => `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function fromOrderItem(item: OrderItem): Line {
  return {
    key: item.id,
    id: item.id,
    productServiceId: item.productServiceId ?? null,
    itemName: item.itemName,
    selectedVariant: item.selectedVariant ?? null,
    itemDescription: item.itemDescription || "",
    category: item.category || "General",
    itemType: item.itemType,
    isCustom: item.isCustom,
    quantity: Number(item.quantity),
    basePrice: Number(item.basePrice),
    finalUnitPrice: Number(item.finalUnitPrice),
    priceAdjustmentReason: item.priceAdjustmentReason || "",
    quantityCompleted: Number(item.quantityCompleted),
    original: item,
  };
}

// Same rule as the server: only a catalog item whose price differs from its catalog price needs a reason
const isAdjusted = (line: Line) =>
  Boolean(line.productServiceId) && !line.isCustom && Math.abs(line.finalUnitPrice - line.basePrice) > 0.001;

const lineChanged = (line: Line) =>
  !line.original ||
  line.quantity !== Number(line.original.quantity) ||
  cents(line.finalUnitPrice) !== cents(Number(line.original.finalUnitPrice)) ||
  (isAdjusted(line) && line.priceAdjustmentReason.trim() !== (line.original.priceAdjustmentReason || ""));

export default function EditOrderItemsModal({ order, onClose, onSaved }: EditOrderItemsModalProps) {
  const [base, setBase] = useState<Order | null>(order);
  const [lines, setLines] = useState<Line[]>([]);
  const [removed, setRemoved] = useState<Line[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [categoryNames, setCategoryNames] = useState<string[]>(["General"]);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  const reset = (o: Order) => {
    setBase(o);
    setLines((o.items || []).map(fromOrderItem));
    setRemoved([]);
  };

  useEffect(() => {
    if (!order) return;
    reset(order);
    setReason("");
    setError(null);
    setLoadingCatalog(true);
    getCatalogItems({ includeInactive: false })
      .then(setCatalogItems)
      .catch((err: unknown) => console.error("Error loading catalog:", err))
      .finally(() => setLoadingCatalog(false));
    getCategories()
      .then((categories) => setCategoryNames(categoryOptionNames(categories)))
      .catch((err: unknown) => console.error("Error loading categories:", err));
  }, [order?.id]);

  const cartCounts = useMemo(
    () =>
      lines.reduce<Record<string, number>>((counts, line) => {
        if (line.productServiceId) counts[line.productServiceId] = (counts[line.productServiceId] || 0) + line.quantity;
        return counts;
      }, {}),
    [lines]
  );

  if (!order || !base) return null;

  const oldTotal = Number(base.totalPrice) || 0;
  const newTotal = lines.reduce((sum, line) => sum + cents(line.quantity * line.finalUnitPrice), 0) / 100;
  const paid = (base.payments || []).filter((p) => !p.voidedAt).reduce((sum, p) => sum + Number(p.amount), 0);
  const newBalance = Math.max(0, newTotal - paid);
  const belowPaid = cents(newTotal) < cents(paid);
  const hasChanges = removed.length > 0 || lines.some(lineChanged);

  const update = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const handleAddCatalogItem = (item: CatalogItem, variant?: CatalogItemVariant) => {
    const variantName = variant?.name || null;
    const price = Number(variant?.price ?? item.basePrice ?? item.defaultUnitPrice ?? 0);
    setLines((prev) => {
      // Same item and option already listed: one more of it
      const existing = prev.find((line) => line.productServiceId === item.id && line.selectedVariant === variantName && !line.isCustom);
      if (existing) return prev.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line));
      return [
        ...prev,
        {
          key: newKey(),
          productServiceId: item.id,
          itemName: item.name,
          selectedVariant: variantName,
          itemDescription: item.description || "",
          category: item.categoryName || "General",
          itemType: item.type,
          isCustom: false,
          quantity: 1,
          basePrice: price,
          finalUnitPrice: price,
          priceAdjustmentReason: "",
          quantityCompleted: 0,
        },
      ];
    });
    setError(null);
  };

  const handleAddCustom = () =>
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        productServiceId: null,
        itemName: "",
        selectedVariant: null,
        itemDescription: "",
        category: "General",
        itemType: "product",
        isCustom: true,
        quantity: 1,
        basePrice: 0,
        finalUnitPrice: 0,
        priceAdjustmentReason: "",
        quantityCompleted: 0,
      },
    ]);

  const handleRemove = (line: Line) => {
    setLines((prev) => prev.filter((l) => l.key !== line.key));
    if (line.id) setRemoved((prev) => [...prev, line]);
  };

  const handleRestore = (line: Line) => {
    setRemoved((prev) => prev.filter((l) => l.key !== line.key));
    setLines((prev) => [...prev, line]);
  };

  const handleSave = async () => {
    if (lines.length === 0) return setError("An order needs at least one item.");
    for (const [index, line] of lines.entries()) {
      const label = line.itemName.trim() || `item #${index + 1}`;
      if (!line.itemName.trim()) return setError(`Enter a name for item #${index + 1}.`);
      if (line.quantity < 1) return setError(`Enter a quantity of at least 1 for ${label}.`);
      if (line.quantity < line.quantityCompleted) {
        return setError(`${label}: quantity can't be lower than the ${line.quantityCompleted} already produced.`);
      }
      if (isAdjusted(line) && !line.priceAdjustmentReason.trim()) {
        return setError(`Add a price adjustment reason for ${label} (catalog price ${formatCurrency(line.basePrice)}).`);
      }
    }
    if (!hasChanges) return setError("Nothing was changed.");
    if (belowPaid) {
      return setError(`The new total is less than the ${formatCurrency(paid)} already paid. An admin must void or correct payments first.`);
    }
    if (!reason.trim()) return setError("Please enter the reason for the change.");

    const items: OrderItemEditLine[] = lines.map((line) =>
      line.id && line.original
        ? {
            id: line.id,
            quantity: line.quantity,
            finalUnitPrice: line.finalUnitPrice,
            priceAdjustmentReason: isAdjusted(line) ? line.priceAdjustmentReason.trim() : null,
            previous: {
              quantity: Number(line.original.quantity),
              finalUnitPrice: Number(line.original.finalUnitPrice),
              quantityCompleted: Number(line.original.quantityCompleted),
            },
          }
        : {
            productServiceId: line.productServiceId,
            itemName: line.itemName.trim(),
            selectedVariant: line.selectedVariant,
            itemDescription: line.itemDescription,
            category: line.category,
            itemType: line.itemType,
            isCustom: line.isCustom,
            quantity: line.quantity,
            finalUnitPrice: line.finalUnitPrice,
            priceAdjustmentReason: isAdjusted(line) ? line.priceAdjustmentReason.trim() : null,
          }
    );

    try {
      setSaving(true);
      setError(null);
      const saved = await updateOrderItems(order.id, {
        reason: reason.trim(),
        expectedTotal: oldTotal,
        items,
        removedItemIds: removed.map((line) => line.id!),
      });
      onSaved(saved);
      onClose();
    } catch (err: any) {
      if (err?.status === 409) {
        // Someone else changed the order: show the current items; the user re-applies their change
        const latest = await getOrderById(order.id).catch(() => null);
        if (latest) {
          reset(latest);
          onSaved(latest);
        }
        setError(`${err.message} The current items are shown now. Please make your change again.`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to update the items.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      wide
      onClose={saving ? () => undefined : onClose}
      title="Edit order items"
      subtitle={`SOA ${base.soaNo} · ${base.customerName}`}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <p className="text-xs text-slate-500">
            Add items the customer asked for, or change quantities and prices. Items with production already done can't
            go below the pcs produced and can't be removed.
          </p>

          <ul className="space-y-3">
            {lines.map((line) => {
              const subtotal = cents(line.quantity * line.finalUnitPrice) / 100;
              const changed = lineChanged(line);
              const adjusted = isAdjusted(line);
              return (
                <li
                  key={line.key}
                  className={cn(
                    "rounded-xl border bg-white p-3 shadow-sm",
                    !line.id ? "border-emerald-300" : changed ? "border-sky-300" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      {line.id || !line.isCustom ? (
                        <p className="font-semibold text-slate-900">
                          {line.itemName}
                          {line.selectedVariant && (
                            <span className="ml-1.5 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] font-bold text-sky-800">
                              {line.selectedVariant}
                            </span>
                          )}
                        </p>
                      ) : (
                        <input
                          value={line.itemName}
                          maxLength={150}
                          onChange={(e) => update(line.key, { itemName: e.target.value })}
                          placeholder="Custom item name"
                          aria-label="Custom item name"
                          className={inputClass}
                        />
                      )}
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {line.itemType === "service" ? <Briefcase className="h-3 w-3 text-sky-600" /> : <Boxes className="h-3 w-3 text-pink-600" />}
                          {line.isCustom ? "Custom" : line.category}
                        </span>
                        {!line.isCustom && line.productServiceId && <span>Catalog {formatCurrency(line.basePrice)}</span>}
                        {line.id ? (
                          <span className={cn("font-semibold", line.quantityCompleted > 0 ? "text-emerald-700" : "text-slate-400")}>
                            {line.quantityCompleted}/{line.original?.quantity} produced
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold uppercase text-emerald-800">New</span>
                        )}
                      </p>
                      {!line.id && line.isCustom && (
                        <select
                          value={line.category}
                          onChange={(e) => update(line.key, { category: e.target.value })}
                          aria-label="Category"
                          className={cn(inputClass, "mt-2")}
                        >
                          {withCurrent(categoryNames, line.category).map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(line)}
                      disabled={line.quantityCompleted > 0}
                      title={line.quantityCompleted > 0 ? "Production has started on this item; lower its quantity instead" : "Remove item"}
                      aria-label={`Remove ${line.itemName || "item"}`}
                      className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[110px_160px_1fr]">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Quantity
                      <QuantityInput
                        value={line.quantity}
                        onChange={(value) => update(line.key, { quantity: value })}
                        className={cn(inputClass, "mt-1", line.quantity < line.quantityCompleted && "border-rose-400")}
                      />
                      {line.original && line.quantity !== Number(line.original.quantity) && (
                        <span className="mt-0.5 block font-normal text-slate-400">was {line.original.quantity}</span>
                      )}
                    </label>
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Unit price
                      <PriceInput
                        value={line.finalUnitPrice}
                        onChange={(value) => update(line.key, { finalUnitPrice: value })}
                        className={cn(inputClass, "mt-1")}
                      />
                      {line.original && cents(line.finalUnitPrice) !== cents(Number(line.original.finalUnitPrice)) && (
                        <span className="mt-0.5 block font-normal text-slate-400">was {formatCurrency(Number(line.original.finalUnitPrice))}</span>
                      )}
                    </label>
                    <div className="col-span-2 text-right sm:col-span-1">
                      <p className="text-[11px] font-semibold text-slate-600">Subtotal</p>
                      <p className="mt-1 font-mono text-lg font-bold text-slate-900">{formatCurrency(subtotal)}</p>
                    </div>
                  </div>

                  {adjusted && (
                    <label className="mt-2 block text-[11px] font-semibold text-amber-800">
                      Price changed from catalog — reason
                      <input
                        value={line.priceAdjustmentReason}
                        maxLength={500}
                        onChange={(e) => update(line.key, { priceAdjustmentReason: e.target.value })}
                        placeholder="e.g. Bulk discount, rush fee"
                        className={cn(inputClass, "mt-1 border-amber-300")}
                      />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>

          {removed.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Removing</p>
              <ul className="mt-1 space-y-1">
                {removed.map((line) => (
                  <li key={line.key} className="flex items-center justify-between gap-2 text-sm text-rose-800">
                    <span className="min-w-0 truncate line-through">
                      {line.itemName}
                      {line.selectedVariant ? ` (${line.selectedVariant})` : ""} · {line.original?.quantity} ×{" "}
                      {formatCurrency(Number(line.original?.finalUnitPrice))}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRestore(line)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Keep
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddCustom}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-400 hover:text-sky-700"
            >
              <Plus className="h-4 w-4" /> Add custom line
            </button>
            <button
              type="button"
              onClick={() => setMobileCatalogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            >
              <Plus className="h-4 w-4" /> Add from catalog
            </button>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-500">Total</span>
              <span className="flex items-center gap-2 font-mono font-bold">
                {cents(newTotal) !== cents(oldTotal) && (
                  <>
                    <span className="text-slate-400 line-through">{formatCurrency(oldTotal)}</span>
                    <ArrowRight className="h-4 w-4 text-sky-500" />
                  </>
                )}
                <span className={cn("text-slate-900", cents(newTotal) !== cents(oldTotal) && "text-sky-700")}>{formatCurrency(newTotal)}</span>
              </span>
            </div>
            <div className="mt-1 flex justify-between text-slate-500">
              <span>Paid so far</span>
              <span className="font-mono">{formatCurrency(paid)}</span>
            </div>
            <div className="mt-1 flex justify-between font-semibold text-slate-700">
              <span>New balance</span>
              <span className="font-mono">{formatCurrency(newBalance)}</span>
            </div>
            {belowPaid && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The new total is less than what the customer already paid. An admin must void or correct payments before
                lowering it this far.
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Reason for the change (required, shown in notifications and the activity log)
            </span>
            <textarea
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer added 20 more shirts, budget revised after layout approval"
              className={inputClass}
            />
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Back</Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges || belowPaid}>
              {saving ? "Saving..." : "Save item changes"}
            </Button>
          </div>
        </div>

        <div className="hidden min-h-0 lg:block">
          <CatalogPickerPanel
            className="sticky top-0 max-h-[70vh]"
            items={catalogItems}
            loading={loadingCatalog}
            cartCounts={cartCounts}
            onAdd={handleAddCatalogItem}
          />
        </div>
      </div>

      {mobileCatalogOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 p-3 lg:hidden">
          <div className="mx-auto flex h-full max-w-md flex-col">
            <CatalogPickerPanel
              className="flex-1"
              items={catalogItems}
              loading={loadingCatalog}
              cartCounts={cartCounts}
              onAdd={handleAddCatalogItem}
              onClose={() => setMobileCatalogOpen(false)}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
