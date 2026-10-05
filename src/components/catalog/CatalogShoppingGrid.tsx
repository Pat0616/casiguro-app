import { useMemo, useState } from "react";
import { Briefcase, Image as ImageIcon, Plus, Search, ShoppingBag } from "lucide-react";
import type { CatalogItem, CatalogItemType } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface CatalogShoppingGridProps {
  items: CatalogItem[];
  loading: boolean;
  cartCounts: Record<string, number>;
  onAdd: (item: CatalogItem) => void;
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
                onClick={() => setCategoryFilter(category)}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const count = cartCounts[item.id] || 0;
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                    {item.type === "service" && <Briefcase className="h-3 w-3" />}
                    {item.type === "service" ? "Service" : "Product"}
                  </span>
                  {count > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                      In cart: {count}
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-3.5">
                  <div className="min-h-12">
                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900">{item.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">{item.categoryName || "General"}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="font-mono text-sm font-bold text-slate-900">{formatCurrency(item.basePrice)}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
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
