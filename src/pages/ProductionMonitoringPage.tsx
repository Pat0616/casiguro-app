import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Factory, Search } from "lucide-react";
import { cn, dueLabel } from "@/lib/utils";
import { GRADIENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import type { Order, OrderStatus } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import UpdateOrderModal from "@/components/orders/UpdateOrderModal";
import { isActiveOrder, orderLink } from "@/lib/orderLinks";

interface ProductionMonitoringPageProps {
  orders: Order[];
  /** Merge an order the server changed (payment recorded/voided) */
  onOrderChange: (order: Order) => void;
  /** Production saved or order cancelled */
  onOrderSaved: (order: Order) => void;
}

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_production", label: "In Production" },
  { key: "ready", label: "Ready for Pickup" },
];

export default function ProductionMonitoringPage({ orders, onOrderChange, onOrderSaved }: ProductionMonitoringPageProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  // The open order lives in the URL (?order=<id>) so other pages can link to it and Back closes it.
  // Only the id is kept, so the modal always gets the latest version of the order (socket updates, payments).
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("order");
  const selected = orders.find((o) => o.id === selectedId) || null;
  const openOrder = (id: string) => setSearchParams({ order: id });
  const closeOrder = () => setSearchParams({}, { replace: true });

  // A link to an order that is no longer here: completed/cancelled ones open on their own page, unknown ids are dropped.
  // Checked once per link, after orders have loaded (a link can be opened before they arrive), so an order that is
  // completed while its window is open stays open here.
  const checkedId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId || orders.length === 0 || checkedId.current === selectedId) return;
    checkedId.current = selectedId;
    if (!selected) closeOrder();
    else if (!isActiveOrder(selected)) navigate(orderLink(selected), { replace: true });
  }, [selectedId, selected, orders.length]);

  const activeOrders = orders.filter(isActiveOrder);

  const filtered = activeOrders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = query.toLowerCase();
    const matchesQuery = !q || o.customerName.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || o.soaNo.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Production" title="Production Monitoring" />

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={cn(inputClass, "pl-10")} placeholder="Search orders..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  filter === f.key ? cn(GRADIENT, "text-white") : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Factory} title="No orders found" subtitle="Try adjusting your search or filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => {
            const cfg = ORDER_STATUS[o.status];
            const pcfg = PAYMENT_STATUS[o.paymentStatus];
            const progress = o.overallProgress !== undefined ? o.overallProgress : (o.quantity > 0 ? Math.round((o.quantityCompleted / o.quantity) * 100) : 0);
            const due = dueLabel(o.dueDate);
            const itemCount = o.items?.length || 1;
            return (
              <button
                key={o.id}
                onClick={() => openOrder(o.id)}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={o.customerName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{o.customerName}</p>
                      <p className="truncate text-xs text-slate-400">SOA {o.soaNo}</p>
                    </div>
                  </div>
                  <Badge config={cfg} label={cfg.label} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-700">{o.product}</p>
                  {itemCount > 1 && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {itemCount} items
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{o.category}</p>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{o.quantityCompleted}/{o.quantity} pcs</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={cn(GRADIENT, "h-full rounded-full")} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-tight", due.badge)}>
                    {due.text}
                  </span>
                  <Badge config={pcfg} label={pcfg.label} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <UpdateOrderModal
        order={selected}
        onClose={closeOrder}
        onOrderChange={onOrderChange}
        onSaved={onOrderSaved}
      />
    </div>
  );
}
