import { useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Phone,
  Search,
  UserCheck,
  Users,
  Wallet,
  X,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { GRADIENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import type { CustomerPaymentFilter, CustomerSummary, Order } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";

interface CustomerOverviewPageProps {
  orders: Order[];
}

const FILTERS: { key: CustomerPaymentFilter; label: string }[] = [
  { key: "all", label: "All Customers" },
  { key: "unpaid", label: "Has Unpaid" },
  { key: "partial", label: "Partially Paid" },
  { key: "paid", label: "Fully Paid" },
];

export default function CustomerOverviewPage({ orders }: CustomerOverviewPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<CustomerPaymentFilter>("all");
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Derive unique customer summaries from orders
  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    orders.forEach((o) => {
      const nameKey = o.customerName.trim();
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          name: o.customerName,
          contactNumber: o.contactNumber || "—",
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
          totalPaid: 0,
          totalBalance: 0,
          hasUnpaid: false,
          standing: "good",
          orders: [],
          lastOrderDate: o.dateOrdered,
        });
      }

      const cust = map.get(nameKey)!;
      if ((cust.contactNumber === "—" || !cust.contactNumber) && o.contactNumber) {
        cust.contactNumber = o.contactNumber;
      }
      cust.totalOrders += 1;
      if (o.status === "completed") {
        cust.completedOrders += 1;
      } else {
        cust.activeOrders += 1;
      }
      cust.totalSpent += o.totalPrice;
      cust.totalPaid += o.amountPaid;
      cust.totalBalance += o.balance;
      cust.orders.push(o);
      if (o.dateOrdered > cust.lastOrderDate) {
        cust.lastOrderDate = o.dateOrdered;
      }
    });

    return Array.from(map.values())
      .map((c) => {
        const hasUnpaid = c.totalBalance > 0;
        return {
          ...c,
          hasUnpaid,
          standing: (hasUnpaid ? "unpaid" : "good") as "good" | "unpaid",
          orders: [...c.orders].sort((a, b) => (a.dateOrdered < b.dateOrdered ? 1 : -1)),
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Global summary statistics for the top metrics cards
  const metrics = useMemo(() => {
    const total = customers.length;
    const goodStanding = customers.filter((c) => c.standing === "good").length;
    const withBalance = customers.filter((c) => c.standing === "unpaid").length;
    const totalReceivables = customers.reduce((sum, c) => sum + c.totalBalance, 0);
    return { total, goodStanding, withBalance, totalReceivables };
  }, [customers]);

  // Filtered customer list based on search and payment status filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.contactNumber.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filter === "unpaid") {
        matchesFilter = c.orders.some((o) => o.paymentStatus === "unpaid" || o.balance > 0);
      } else if (filter === "partial") {
        matchesFilter = c.orders.some((o) => o.paymentStatus === "partial");
      } else if (filter === "paid") {
        matchesFilter = c.standing === "good" && c.totalBalance === 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [customers, searchQuery, filter]);

  // Select first customer if none is explicitly selected or if current selection is filtered out
  const selectedCustomer = useMemo(() => {
    if (filteredCustomers.length === 0) return null;
    if (selectedCustomerName) {
      const found = filteredCustomers.find((c) => c.name === selectedCustomerName);
      if (found) return found;
    }
    return filteredCustomers[0];
  }, [filteredCustomers, selectedCustomerName]);

  const handleSelectCustomer = (name: string) => {
    setSelectedCustomerName(name);
    setMobileDetailOpen(true);
    // Smooth scroll to top on mobile for instant visibility
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const overviewCards = [
    {
      label: "Total Customers",
      value: metrics.total,
      icon: Users,
      tint: "text-sky-600 bg-sky-50",
    },
    {
      label: "Good Standing (Fully Paid)",
      value: metrics.goodStanding,
      icon: UserCheck,
      tint: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "With Outstanding Balance",
      value: metrics.withBalance,
      icon: AlertCircle,
      tint: "text-rose-600 bg-rose-50",
    },
    {
      label: "Total Uncollected Balance",
      value: formatCurrency(metrics.totalReceivables),
      icon: Wallet,
      tint: "text-pink-600 bg-pink-50",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Directory & Credit Standing" title="Customer Overview" />

      {/* Top Metrics Row - Hidden on mobile if detail is open for cleaner viewing */}
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", mobileDetailOpen ? "hidden lg:grid" : "grid")}>
        {overviewCards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", c.tint)}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-extrabold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filter Bar - Hidden on mobile if detail is open for cleaner focus */}
      <Card className={cn("p-4", mobileDetailOpen ? "hidden lg:block" : "block")}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className={cn(inputClass, "pl-10 pr-9")}
              placeholder="Search customer name or contact number..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setMobileDetailOpen(false);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setMobileDetailOpen(false);
                }}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  filter === f.key
                    ? cn(GRADIENT, "text-white shadow-sm")
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Master-Detail Customer Directory Layout */}
      {filteredCustomers.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={Users}
            title="No customers found"
            subtitle="Try adjusting your search keywords or payment filter."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Customer Master List (Left Column) */}
          <div
            className={cn(
              "space-y-3 lg:col-span-4 xl:col-span-4",
              mobileDetailOpen ? "hidden lg:block" : "block"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customers ({filteredCustomers.length})
              </span>
              <span className="text-xs text-slate-400 lg:hidden">Tap to view full details</span>
            </div>

            <div className="space-y-2.5 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.name === cust.name;
                const isGoodStanding = cust.standing === "good";

                return (
                  <button
                    key={cust.name}
                    onClick={() => handleSelectCustomer(cust.name)}
                    className={cn(
                      "group w-full rounded-2xl border p-4 text-left transition-all duration-150",
                      isSelected
                        ? "border-pink-300 bg-gradient-to-r from-pink-50/70 to-sky-50/70 shadow-sm ring-2 ring-pink-200/60"
                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={cust.name} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 group-hover:text-pink-600 transition-colors">
                            {cust.name}
                          </p>
                          <p className="truncate text-xs text-slate-500">{cust.contactNumber}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-pink-500 lg:hidden" />
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                      {isGoodStanding ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Good Standing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                          <AlertCircle className="h-3 w-3" /> Unpaid: {formatCurrency(cust.totalBalance)}
                        </span>
                      )}

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">{formatCurrency(cust.totalSpent)}</p>
                        <p className="text-[10px] text-slate-400">
                          {cust.totalOrders} order{cust.totalOrders === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Profile & Transaction Ledger Detail (Right Column) */}
          <div
            className={cn(
              "space-y-6 lg:col-span-8 xl:col-span-8",
              mobileDetailOpen ? "block" : "hidden lg:block"
            )}
          >
            {selectedCustomer && (
              <>
                {/* Mobile Back Button Navigation */}
                <div className="flex items-center justify-between lg:hidden">
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-pink-600 active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4 text-slate-500" />
                    Back to Customer List
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    Customer Profile
                  </span>
                </div>

                {/* Customer Identity Card & Standing Banner */}
                <Card className="p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-4">
                      <Avatar name={selectedCustomer.name} size="lg" />
                      <div>
                        <h3 className="font-display text-xl font-extrabold text-slate-900">
                          {selectedCustomer.name}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {selectedCustomer.contactNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            Last order: {formatDate(selectedCustomer.lastOrderDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credit Standing Badge / Box */}
                    <div className="shrink-0">
                      {selectedCustomer.standing === "good" ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-800">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                              Good Standing
                            </p>
                            <p className="text-[11px] text-emerald-600">All orders fully settled</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-800">
                          <AlertCircle className="h-5 w-5 text-rose-600" />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-800">
                              Has Unpaid Balance
                            </p>
                            <p className="text-[11px] font-semibold text-rose-600">
                              Outstanding: {formatCurrency(selectedCustomer.totalBalance)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Quick Financial Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-[11px] font-semibold text-slate-400">Total Orders</p>
                      <p className="mt-0.5 font-display text-lg font-bold text-slate-800">
                        {selectedCustomer.totalOrders}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {selectedCustomer.activeOrders} active · {selectedCustomer.completedOrders} completed
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-[11px] font-semibold text-slate-400">Total Lifetime Value</p>
                      <p className="mt-0.5 font-display text-lg font-bold text-slate-800">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </p>
                      <p className="text-[10px] text-slate-500">Gross order volume</p>
                    </div>

                    <div className="rounded-xl bg-emerald-50/60 p-3.5">
                      <p className="text-[11px] font-semibold text-emerald-600">Total Paid</p>
                      <p className="mt-0.5 font-display text-lg font-bold text-emerald-700">
                        {formatCurrency(selectedCustomer.totalPaid)}
                      </p>
                      <p className="text-[10px] text-emerald-600/80">Collected payments</p>
                    </div>

                    <div
                      className={cn(
                        "rounded-xl p-3.5",
                        selectedCustomer.totalBalance > 0 ? "bg-rose-50/70" : "bg-slate-50"
                      )}
                    >
                      <p
                        className={cn(
                          "text-[11px] font-semibold",
                          selectedCustomer.totalBalance > 0 ? "text-rose-600" : "text-slate-400"
                        )}
                      >
                        Remaining Balance
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-display text-lg font-bold",
                          selectedCustomer.totalBalance > 0 ? "text-rose-700" : "text-slate-800"
                        )}
                      >
                        {formatCurrency(selectedCustomer.totalBalance)}
                      </p>
                      <p
                        className={cn(
                          "text-[10px]",
                          selectedCustomer.totalBalance > 0 ? "text-rose-600/80" : "text-slate-500"
                        )}
                      >
                        {selectedCustomer.totalBalance > 0 ? "Action required" : "Zero dues"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Customer Transactions Ledger */}
                <Card className="overflow-hidden p-5">
                  <SectionHeading
                    title={`Transaction History (${selectedCustomer.orders.length})`}
                    subtitle={`All orders and records associated with ${selectedCustomer.name}`}
                  />

                  <div className="mt-4 space-y-3">
                    {selectedCustomer.orders.map((o) => {
                      const cfg = ORDER_STATUS[o.status];
                      const pcfg = PAYMENT_STATUS[o.paymentStatus];
                      const isUnpaid = o.balance > 0;

                      return (
                        <div
                          key={o.id}
                          className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-500">
                                  {o.refNo}
                                </span>
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                  {o.orderType === "stock" ? "Stock Order" : "Custom Order"}
                                </span>
                                <Badge config={cfg} label={cfg.label} />
                                <Badge config={pcfg} label={pcfg.label} />
                              </div>

                              <h4 className="mt-2 text-base font-bold text-slate-900">{o.product}</h4>
                              <p className="text-xs text-slate-400">{o.category}</p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="font-display text-base font-extrabold text-slate-900">
                                {formatCurrency(o.totalPrice)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {o.quantity} pcs @ {formatCurrency(o.unitPrice)}
                              </p>
                            </div>
                          </div>

                          {/* Payment Breakdown & Dates */}
                          <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-4">
                            <div>
                              <span className="block text-[10px] text-slate-400">Date Ordered</span>
                              <span className="font-semibold text-slate-700">{formatDate(o.dateOrdered)}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400">
                                {o.status === "completed" ? "Date Completed" : "Due Date"}
                              </span>
                              <span className="font-semibold text-slate-700">
                                {formatDate(o.dateCompleted || o.dueDate)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400">Amount Paid</span>
                              <span className="font-semibold text-emerald-600">{formatCurrency(o.amountPaid)}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-400">Balance</span>
                              <span className={cn("font-bold", isUnpaid ? "text-rose-600" : "text-slate-700")}>
                                {formatCurrency(o.balance)}
                              </span>
                            </div>
                          </div>

                          {/* Order Notes if present */}
                          {o.notes && (
                            <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
                              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="italic">{o.notes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
