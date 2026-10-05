import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_STATUS } from "@/lib/constants";
import type { CustomerPaymentFilter, Order } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CompletedTransactionsPage({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<CustomerPaymentFilter>("all");

  const completed = orders.filter((o) => o.status === "completed" && o.dateCompleted);
  const years = Array.from(new Set(completed.map((o) => o.dateCompleted!.slice(0, 4)))).sort((a, b) => (a < b ? 1 : -1));

  const filtered = completed
    .filter((o) => {
      const [y, m] = o.dateCompleted!.split("-");
      const matchYear = year === "all" || y === year;
      const matchMonth = month === "all" || Number(m) === Number(month);
      const matchPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.refNo.toLowerCase().includes(q) ||
        (o.items && o.items.some((it) => it.itemName.toLowerCase().includes(q))) ||
        formatDate(o.dateCompleted).toLowerCase().includes(q);
      return matchYear && matchMonth && matchPayment && matchQuery;
    })
    .sort((a, b) => (a.dateCompleted! < b.dateCompleted! ? 1 : -1));

  const paymentFilters: { key: CustomerPaymentFilter; label: string }[] = [
    { key: "all", label: "All Payments" },
    { key: "unpaid", label: "Unpaid" },
    { key: "partial", label: "Partially Paid" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Records" title="Completed Transactions" />

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={cn(inputClass, "pl-10")} placeholder="Search customer, product, category, date..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <select aria-label="Filter by completion month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="all">All Months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select aria-label="Filter by completion year" className={inputClass} value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Filter completed transactions by payment status">
            <span className="mr-1 text-xs font-semibold text-slate-500">Payment status:</span>
            {paymentFilters.map((payment) => (
              <button
                key={payment.key}
                type="button"
                onClick={() => setPaymentFilter(payment.key)}
                aria-pressed={paymentFilter === payment.key}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  paymentFilter === payment.key
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {payment.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={CheckCircle2} title="No completed transactions" subtitle="Try a different filter or search term." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => {
                  const pcfg = PAYMENT_STATUS[o.paymentStatus];
                  return (
                    <tr key={o.id} className="transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-400">{o.refNo}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{o.customerName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{o.product}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{o.category}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{formatCurrency(o.totalPrice)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(o.dateCompleted)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5"><Badge config={pcfg} label={pcfg.label} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
