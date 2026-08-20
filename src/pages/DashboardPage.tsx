import { useMemo } from "react";
import { Boxes, CalendarClock, TrendingUp, Wallet } from "lucide-react";
import { cn, daysDiff, formatCurrency, formatDate } from "@/lib/utils";
import { GRADIENT, NOW, ORDER_STATUS } from "@/lib/constants";
import type { Order } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

export default function DashboardPage({ orders }: { orders: Order[] }) {
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "completed");
    const dueThisWeek = active.filter((o) => {
      const d = daysDiff(o.dueDate);
      return d >= 0 && d <= 7;
    });
    const revenueThisMonth = orders
      .filter((o) => o.dateOrdered.slice(0, 7) === "2026-08")
      .reduce((sum, o) => sum + o.amountPaid, 0);
    const outstanding = orders.filter((o) => o.paymentStatus !== "paid").reduce((sum, o) => sum + o.balance, 0);
    return { activeCount: active.length, dueThisWeek: dueThisWeek.length, revenueThisMonth, outstanding };
  }, [orders]);

  const recentOrders = useMemo(() => [...orders].sort((a, b) => (a.dateOrdered < b.dateOrdered ? 1 : -1)).slice(0, 6), [orders]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.product] = (map[o.product] || 0) + o.quantity;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);
  const maxVolume = topProducts.length ? topProducts[0][1] : 1;

  const cards = [
    { label: "Active Orders", value: stats.activeCount, icon: Boxes, tint: "text-sky-600 bg-sky-50" },
    { label: "Due This Week", value: stats.dueThisWeek, icon: CalendarClock, tint: "text-amber-600 bg-amber-50" },
    { label: "Revenue This Month", value: formatCurrency(stats.revenueThisMonth), icon: TrendingUp, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Outstanding Balance", value: formatCurrency(stats.outstanding), icon: Wallet, tint: "text-pink-600 bg-pink-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-pink-600">Overview</p>
        <h2 className="font-display text-2xl font-extrabold text-slate-900">Welcome back, Admin 👋</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's what's happening across the shop today, {NOW.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", c.tint)}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-extrabold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeading title="Recent Orders" />
          <div className="divide-y divide-slate-100">
            {recentOrders.map((o) => {
              const cfg = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={o.customerName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{o.customerName}</p>
                      <p className="truncate text-xs text-slate-400">{o.category} · {formatDate(o.dateOrdered)}</p>
                    </div>
                  </div>
                  <Badge config={cfg} label={cfg.label} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading title="Top Products by Volume" />
          <div className="space-y-4">
            {topProducts.map(([name, qty]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="truncate pr-2">{name}</span>
                  <span className="shrink-0 text-slate-400">{qty} pcs</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={cn(GRADIENT, "h-full rounded-full")} style={{ width: `${(qty / maxVolume) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
