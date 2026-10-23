import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { cn, formatCurrency, formatDate, formatDocDate } from "@/lib/utils";
import { PAYMENT_STATUS } from "@/lib/constants";
import type { CustomerPaymentFilter, Order } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import OrderDocumentsModal from "@/components/orders/OrderDocumentsModal";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface CompletedTransactionsPageProps {
  orders: Order[];
  onOrderUpdated: (order: Order) => void;
}

export default function CompletedTransactionsPage({ orders, onOrderUpdated }: CompletedTransactionsPageProps) {
  const [selected, setSelected] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  // "cancelled" switches the list to cancelled orders (kept on record, dated by when they were cancelled)
  const [paymentFilter, setPaymentFilter] = useState<CustomerPaymentFilter | "cancelled">("all");
  const showCancelled = paymentFilter === "cancelled";
  const recordDate = (o: Order) => (showCancelled ? o.cancelledAt?.slice(0, 10) : o.dateCompleted) || "";

  const completed = orders.filter((o) => (showCancelled ? o.status === "cancelled" : o.status === "completed") && recordDate(o));
  const years = Array.from(new Set(completed.map((o) => recordDate(o).slice(0, 4)))).sort((a, b) => (a < b ? 1 : -1));

  const filtered = completed
    .filter((o) => {
      const [y, m] = recordDate(o).split("-");
      const matchYear = year === "all" || y === year;
      const matchMonth = month === "all" || Number(m) === Number(month);
      const matchPayment = paymentFilter === "all" || showCancelled || o.paymentStatus === paymentFilter;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        [o.soaNo, o.prNo, o.poNo, o.siOrNo, o.drNo].some((ref) => ref?.toLowerCase().includes(q)) ||
        (o.items && o.items.some((it) => it.itemName.toLowerCase().includes(q))) ||
        formatDate(recordDate(o)).toLowerCase().includes(q);
      return matchYear && matchMonth && matchPayment && matchQuery;
    })
    .sort((a, b) => (recordDate(a) < recordDate(b) ? 1 : -1));

  const paymentFilters: { key: CustomerPaymentFilter | "cancelled"; label: string }[] = [
    { key: "all", label: "All Payments" },
    { key: "unpaid", label: "Unpaid" },
    { key: "partial", label: "Partially Paid" },
    { key: "paid", label: "Paid" },
    { key: "cancelled", label: "Cancelled Orders" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Records" title="Completed Transactions" />

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={cn(inputClass, "pl-10")} placeholder="Search customer, product, SOA/PO/DR no..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
            <EmptyState
              icon={CheckCircle2}
              title={showCancelled ? "No cancelled orders" : "No completed transactions"}
              subtitle="Try a different filter or search term."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">SOA No / Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">{showCancelled ? "Cancelled" : "Completed"}</th>
                  <th className="px-5 py-3">{showCancelled ? "Reason" : "Payment"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => {
                  const pcfg = PAYMENT_STATUS[o.paymentStatus];
                  return (
                    <tr key={o.id} onClick={() => setSelected(o)} title="Open documents and payments" className="cursor-pointer transition hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs">
                        <span className="block font-bold text-slate-700">{o.soaNo}</span>
                        <span className="text-slate-400">{formatDocDate(o.soaDate)}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{o.customerName}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{o.product}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{o.category}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800">{formatCurrency(o.totalPrice)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{formatDate(recordDate(o))}</td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        {showCancelled ? (
                          <span className="block max-w-[16rem] truncate text-xs text-slate-500" title={o.cancelReason || ""}>
                            {o.cancelReason} {o.cancelledByName && <span className="text-slate-400">· {o.cancelledByName}</span>}
                          </span>
                        ) : (
                          <Badge config={pcfg} label={pcfg.label} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrderDocumentsModal order={selected} onClose={() => setSelected(null)} onSaved={onOrderUpdated} />
    </div>
  );
}
