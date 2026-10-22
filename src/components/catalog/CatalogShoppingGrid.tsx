import { useMemo, useState } from "react";
import { Briefcase, Image as ImageIcon, Plus, Search, ShoppingBag } from "lucide-react";
import type { CatalogItem, CatalogItemType, CatalogItemVariant } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CatalogShoppingGridProps {
  items: CatalogItem[];
  loading: boolean;
  cartCounts: Record<string, number>;
  onAdd: (item: CatalogItem, variant?: CatalogItemVariant) => void;
}

export default function CatalogShoppingGrid({
  items,
  loading,
  cartCounts,
  onAdd,
}: CatalogShoppingGridProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CatalogItemType>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const categories = useMemo(
    () =>
      Array.from(
        new Set([
          ...items
            .filter((item) => typeFilter === "all" || item.type === typeFilter)
            .map((item) => item.categoryName?.trim())
            .filter((category): category is string => Boolean(category)),
        ])
      ).sort((a, b) => a.localeCompare(b)),
    [items, typeFilter]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        item.categoryName?.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.categoryName?.toLowerCase().includes(query);
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [items, search, typeFilter, categoryFilter]);
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Choose products & services</h3>
          <p className="text-sm text-slate-500">Add catalog items to the cart, then review quantities and pricing.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products and services"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex gap-2" aria-label="Filter catalog by type">
        {([
          ["all", "All items"],
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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              typeFilter === type
                ? "bg-sky-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {typeFilter === "product" ? "Product categories" : typeFilter === "service" ? "Service categories" : "Categories"}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", ...categories].map((category) => {
            const selected = categoryFilter === category;
            const label = category === "all" ? "All categories" : category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setCategoryFilter(category);
                }}
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  selected
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
          Loading catalog...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <ShoppingBag className="mx-auto mb-2 h-7 w-7 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">No catalog items found</p>
          <p className="mt-1 text-xs text-slate-500">Try another search or item type.</p>
        </div>
      ) : (
        // Compact cards so large catalogs need less scrolling: up to 6 per row on wide screens
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filteredItems.map((item) => {
            const count = cartCounts[item.id] || 0;
            const variants = item.variants || [];
            const selectedVariant = variants.find((variant) => variant.name === selectedVariants[item.id]);
            const canAdd = variants.length === 0 || Boolean(selectedVariant);
            return (
              <article
                key={item.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-200 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.imageUrl ? (
                    // Absolutely positioned so tall images can't stretch the 4:3 box (and with it the whole row)
                    <img src={item.imageUrl} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ImageIcon className="h-7 w-7" aria-hidden="true" />
                    </div>
                  )}
                  {item.type === "service" && (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm">
                      <Briefcase className="h-2.5 w-2.5" />
                      Service
                    </span>
                  )}
                  {count > 0 && (
                    <span
                      className="absolute right-1.5 top-1.5 rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                      title={`${count} in cart`}
                    >
                      ×{count}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-2">
                  <div>
                    <h4 className="line-clamp-2 min-h-8 text-xs font-bold leading-4 text-slate-900" title={item.name}>{item.name}</h4>
                    <p className="truncate text-[10px] text-slate-500">{item.categoryName || "General"}</p>
                  </div>
                  {variants.length > 0 && (
                    <select
                      aria-label={`Select option for ${item.name}`}
                      value={selectedVariant?.name || ""}
                      onChange={(event) =>
                        setSelectedVariants((current) => ({ ...current, [item.id]: event.target.value }))
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select option</option>
                      {variants.map((variant) => (
                        <option key={variant.name} value={variant.name}>
                          {variant.name} — {formatCurrency(variant.price)}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-1 border-t border-slate-100 pt-1.5">
                    <span className="truncate font-mono text-[11px] font-bold text-slate-900">
                      {formatCurrency(selectedVariant?.price ?? item.basePrice)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdd(item, selectedVariant)}
                      disabled={!canAdd}
                      aria-label={`Add ${item.name} to cart`}
                      title={canAdd ? "Add to cart" : "Select an option first"}
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-sky-600 px-1.5 py-1 text-[11px] font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
