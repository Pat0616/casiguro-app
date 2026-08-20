import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { cn, formatCurrency, pad } from "@/lib/utils";
import { GRADIENT, MONTH_NAMES, PIE_COLORS } from "@/lib/constants";
import type { Order } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";

export default function StatisticsPage({ orders }: { orders: Order[] }) {
  const completed = orders.filter((o) => o.status === "completed" && o.dateCompleted);
  const years = Array.from(new Set(completed.map((o) => o.dateCompleted!.slice(0, 4)))).sort((a, b) => (a < b ? 1 : -1));
  const [mode, setMode] = useState<"year" | "month">("year");
  const [year, setYear] = useState(years[0] || "2026");
  const [month, setMonth] = useState("8");

  const inPeriod = completed.filter((o) => {
    const [y, m] = o.dateCompleted!.split("-");
    if (mode === "year") return y === year;
    return y === year && Number(m) === Number(month);
  });

  const revenue = inPeriod.reduce((s, o) => s + o.totalPrice, 0);
  const onTimeCount = inPeriod.filter((o) => o.dateCompleted! <= o.dueDate).length;
  const onTimeRate = inPeriod.length ? Math.round((onTimeCount / inPeriod.length) * 100) : 0;
  const productVolume: Record<string, number> = {};
  inPeriod.forEach((o) => {
    productVolume[o.product] = (productVolume[o.product] || 0) + o.quantity;
  });
  const mostSold = Object.entries(productVolume).sort((a, b) => b[1] - a[1])[0];

  const chartData = useMemo(() => {
    if (mode === "year") {
      return MONTH_NAMES.map((m, idx) => ({
        label: m,
        revenue: completed
          .filter((o) => o.dateCompleted!.slice(0, 4) === year && Number(o.dateCompleted!.slice(5, 7)) === idx + 1)
          .reduce((s, o) => s + o.totalPrice, 0),
      }));
    }
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const key = `${year}-${pad(Number(month))}-${pad(day)}`;
      return { label: String(day), revenue: completed.filter((o) => o.dateCompleted === key).reduce((s, o) => s + o.totalPrice, 0) };
    });
  }, [mode, year, month, completed]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    inPeriod.forEach((o) => {
      map[o.category] = (map[o.category] || 0) + o.totalPrice;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [inPeriod]);

  const topCustomers = useMemo(() => {
    const map: Record<string, number> = {};
    inPeriod.forEach((o) => {
      map[o.customerName] = (map[o.customerName] || 0) + o.totalPrice;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [inPeriod]);
  const maxCustomerSpend = topCustomers.length ? topCustomers[0][1] : 1;

  const cards = [
    { label: mode === "year" ? "Revenue this Year" : "Revenue this Month", value: formatCurrency(revenue), icon: TrendingUp, tint: "text-emerald-600 bg-emerald-50" },
    { label: "Orders Completed", value: inPeriod.length, icon: CheckCircle2, tint: "text-sky-600 bg-sky-50" },
    { label: "On-Time Rate", value: `${onTimeRate}%`, icon: Clock, tint: "text-violet-600 bg-violet-50" },
    { label: "Most Sold Product", value: mostSold ? mostSold[0] : "—", icon: ShoppingBag, tint: "text-pink-600 bg-pink-50", small: true },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Insights"
        title="Statistics"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              {(["year", "month"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition", mode === m ? "bg-white text-pink-600 shadow-sm" : "text-slate-500")}
                >
                  {m}
                </button>
              ))}
            </div>
            {mode === "month" && (
              <select className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)}>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            )}
            <select className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}>
              {(years.length ? years : ["2026"]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", c.tint)}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className={cn("font-display font-extrabold text-slate-900", c.small ? "truncate text-base" : "text-2xl")}>{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionHeading title={mode === "year" ? "Revenue by Month" : "Revenue by Day"} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9" }} />
                <Line type="monotone" dataKey="revenue" stroke="#db2777" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionHeading title="Revenue by Category" />
          {categoryData.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data" subtitle="No completed sales in this period." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {c.name}
                </span>
                <span className="font-semibold text-slate-700">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionHeading title="Most Valuable Customers" />
        {topCustomers.length === 0 ? (
          <EmptyState icon={Sparkles} title="No customer spend yet" subtitle="Complete some orders in this period to see rankings." />
        ) : (
          <div className="space-y-3">
            {topCustomers.map(([name, spend], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                <Avatar name={name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-semibold text-slate-800">{name}</span>
                    <span className="font-bold text-slate-800">{formatCurrency(spend)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={cn(GRADIENT, "h-full rounded-full")} style={{ width: `${(spend / maxCustomerSpend) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
