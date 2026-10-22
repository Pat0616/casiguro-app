import { useMemo, useState } from "react";
import { Image as ImageIcon, Plus, Search, ShoppingBag, X } from "lucide-react";
import type { CatalogItem, CatalogItemType, CatalogItemVariant } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";

interface CatalogPickerPanelProps {
  items: CatalogItem[];
  loading: boolean;
  cartCounts: Record<string, number>;
  onAdd: (item: CatalogItem, variant?: CatalogItemVariant) => void;
  className?: string;
  onClose?: () => void;
}

// Compact side-panel catalog for building a document (quotation) rather than a shopping cart
export default function CatalogPickerPanel({ items, loading, cartCounts, onAdd, className, onClose }: CatalogPickerPanelProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CatalogItemType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .filter((item) => typeFilter === "all" || item.type === typeFilter)
            .map((item) => item.categoryName?.trim())
            .filter((category): category is string => Boolean(category))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items, typeFilter]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesCategory = categoryFilter === "all" || item.categoryName?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.categoryName?.toLowerCase().includes(query);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [items, search, typeFilter, categoryFilter]);

  return (
    <section className={cn("flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white", className)}>
      <div className="space-y-2.5 border-b border-slate-100 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Catalog</h3>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close catalog" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items"
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Filter catalog by type">
          {([
            ["all", "All"],
            ["product", "Products"],
            ["service", "Services"],
          ] as const).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTypeFilter(type);
                setCategoryFilter("all");
              }}
              aria-pressed={typeFilter === type}
              className={cn(
                "flex-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition",
                typeFilter === type ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter catalog by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="p-6 text-center text-xs text-slate-500">Loading catalog...</p>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-center">
            <ShoppingBag className="mx-auto mb-1.5 h-5 w-5 text-slate-400" />
            <p className="text-xs font-semibold text-slate-600">No catalog items found</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {filteredItems.map((item) => {
              const count = cartCounts[item.id] || 0;
              const variants = item.variants || [];
              const selectedVariant = variants.find((variant) => variant.name === selectedVariants[item.id]);
              const canAdd = variants.length === 0 || Boolean(selectedVariant);
              return (
                <li key={item.id} className="rounded-lg border border-slate-100 p-2 transition hover:border-sky-200 hover:bg-sky-50/30">
                  <div className="flex gap-2">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon className="h-4 w-4" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">{item.name}</p>
                        {count > 0 && (
                          <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700" title="Quantity already on this quotation">
                            ×{count}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {item.categoryName || "General"} · {item.type === "service" ? "Service" : "Product"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {variants.length > 0 ? (
                      <select
                        aria-label={`Select option for ${item.name}`}
                        value={selectedVariant?.name || ""}
                        onChange={(event) => setSelectedVariants((current) => ({ ...current, [item.id]: event.target.value }))}
                        className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="">Select option</option>
                        {variants.map((variant) => (
                          <option key={variant.name} value={variant.name}>
                            {variant.name} — {formatCurrency(variant.price)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="flex-1 font-mono text-[11px] font-bold text-slate-800">{formatCurrency(item.basePrice)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onAdd(item, selectedVariant)}
                      disabled={!canAdd}
                      title={canAdd ? "Add to quotation" : "Select an option first"}
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-sky-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
