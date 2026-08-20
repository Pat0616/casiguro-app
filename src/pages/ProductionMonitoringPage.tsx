import { useState } from "react";
import { Factory, Search } from "lucide-react";
import { cn, dueLabel } from "@/lib/utils";
import { GRADIENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import type { Order, OrderStatus, OrderUpdatePayload } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import UpdateOrderModal from "@/components/orders/UpdateOrderModal";

interface ProductionMonitoringPageProps {
  orders: Order[];
  onUpdateOrder: (id: string, changes: OrderUpdatePayload) => void;
}

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_production", label: "In Production" },
  { key: "ready", label: "Ready for Pickup" },
];

export default function ProductionMonitoringPage({ orders, onUpdateOrder }: ProductionMonitoringPageProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);

  const activeOrders = orders.filter((o) => o.status !== "completed");

  const filtered = activeOrders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = query.toLowerCase();
    const matchesQuery = !q || o.customerName.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || o.refNo.toLowerCase().includes(q);
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
            const progress = Math.round((o.quantityCompleted / o.quantity) * 100);
            const due = dueLabel(o.dueDate);
            return (
              <button
                key={o.id}
                onClick={() => setSelected(o)}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={o.customerName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{o.customerName}</p>
                      <p className="truncate text-xs text-slate-400">{o.refNo}</p>
                    </div>
                  </div>
                  <Badge config={cfg} label={cfg.label} />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-slate-700">{o.product}</p>
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
                  <span className={cn("text-xs font-semibold", due.tone)}>{due.text}</span>
                  <Badge config={pcfg} label={pcfg.label} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <UpdateOrderModal
        order={selected}
        onClose={() => setSelected(null)}
        onSave={(id, changes) => {
          onUpdateOrder(id, changes);
          setSelected(null);
        }}
      />
    </div>
  );
}
