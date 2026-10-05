import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  Search,
  UserCheck,
  Users,
  Wallet,
  X,
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
import Modal from "@/components/ui/Modal";

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

  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    orders.forEach((order) => {
      const nameKey = order.customerName.trim();
      if (!map.has(nameKey)) {
        map.set(nameKey, {
          name: order.customerName,
          contactNumber: order.contactNumber || "—",
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
          totalPaid: 0,
          totalBalance: 0,
          hasUnpaid: false,
          standing: "good",
          orders: [],
          lastOrderDate: order.dateOrdered,
        });
      }

      const customer = map.get(nameKey)!;
      if ((customer.contactNumber === "—" || !customer.contactNumber) && order.contactNumber) {
        customer.contactNumber = order.contactNumber;
      }
      customer.totalOrders += 1;
      if (order.status === "completed") customer.completedOrders += 1;
      else customer.activeOrders += 1;
      customer.totalSpent += order.totalPrice;
      customer.totalPaid += order.amountPaid;
      customer.totalBalance += order.balance;
      customer.orders.push(order);
      if (order.dateOrdered > customer.lastOrderDate) customer.lastOrderDate = order.dateOrdered;
    });

    return Array.from(map.values())
      .map((customer) => {
        const hasUnpaid = customer.totalBalance > 0;
        return {
          ...customer,
          hasUnpaid,
          standing: (hasUnpaid ? "unpaid" : "good") as "good" | "unpaid",
          orders: [...customer.orders].sort((a, b) => (a.dateOrdered < b.dateOrdered ? 1 : -1)),
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const metrics = useMemo(() => {
    const goodStanding = customers.filter((customer) => customer.standing === "good").length;
    const withBalance = customers.filter((customer) => customer.standing === "unpaid").length;
    const totalReceivables = customers.reduce((sum, customer) => sum + customer.totalBalance, 0);
    return { total: customers.length, goodStanding, withBalance, totalReceivables };
  }, [customers]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          customer.name.toLowerCase().includes(query) ||
          customer.contactNumber.toLowerCase().includes(query);
        let matchesFilter = true;
        if (filter === "unpaid") {
          matchesFilter = customer.orders.some((order) => order.paymentStatus === "unpaid" || order.balance > 0);
        } else if (filter === "partial") {
          matchesFilter = customer.orders.some((order) => order.paymentStatus === "partial");
        } else if (filter === "paid") {
          matchesFilter = customer.standing === "good" && customer.totalBalance === 0;
        }
        return matchesSearch && matchesFilter;
      }),
    [customers, searchQuery, filter]
  );

  const selectedCustomer = selectedCustomerName
    ? customers.find((customer) => customer.name === selectedCustomerName) || null
    : null;

  const overviewCards = [
    { label: "Total Customers", value: metrics.total, icon: Users, tint: "text-sky-600 bg-sky-50" },
    { label: "Good Standing (Fully Paid)", value: metrics.goodStanding, icon: UserCheck, tint: "text-emerald-600 bg-emerald-50" },
    { label: "With Outstanding Balance", value: metrics.withBalance, icon: AlertCircle, tint: "text-rose-600 bg-rose-50" },
    { label: "Total Uncollected Balance", value: formatCurrency(metrics.totalReceivables), icon: Wallet, tint: "text-pink-600 bg-pink-50" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Directory & Credit Standing" title="Customer Overview" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <Card key={card.label} className="p-5">
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", card.tint)}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-extrabold text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">{card.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className={cn(inputClass, "pl-10 pr-9")}
              placeholder="Search customer name or contact number..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((customerFilter) => (
              <button
                key={customerFilter.key}
                type="button"
                onClick={() => setFilter(customerFilter.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                  filter === customerFilter.key
                    ? cn(GRADIENT, "text-white shadow-sm")
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {customerFilter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredCustomers.length === 0 ? (
        <Card className="p-12">
          <EmptyState icon={Users} title="No customers found" subtitle="Try adjusting your search keywords or payment filter." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-900">Customer List</h2>
              <p className="mt-0.5 text-xs text-slate-500">Select a customer name or details button to view their profile and orders.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{filteredCustomers.length} customers</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3 text-right">Total spent</th>
                  <th className="px-5 py-3 text-right">Balance</th>
                  <th className="px-5 py-3">Standing</th>
                  <th className="px-5 py-3">Last order</th>
                  <th className="px-5 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.name} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerName(customer.name)}
                        className="flex items-center gap-3 text-left"
                      >
                        <Avatar name={customer.name} size="sm" />
                        <span>
                          <span className="block font-semibold text-slate-900 hover:text-sky-700">{customer.name}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />{customer.contactNumber}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-800">{customer.totalOrders}</span>
                      <span className="ml-1 text-xs text-slate-500">
                        ({customer.activeOrders} active · {customer.completedOrders} completed)
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{formatCurrency(customer.totalSpent)}</td>
                    <td className={cn("px-5 py-3.5 text-right font-semibold", customer.totalBalance > 0 ? "text-rose-700" : "text-slate-500")}>
                      {formatCurrency(customer.totalBalance)}
                    </td>
                    <td className="px-5 py-3.5">
                      {customer.standing === "good" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Good standing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                          <AlertCircle className="h-3 w-3" /> Outstanding
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{formatDate(customer.lastOrderDate)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerName(customer.name)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selectedCustomer && (
        <Modal
          open
          onClose={() => setSelectedCustomerName(null)}
          title={selectedCustomer.name}
          subtitle="Customer profile and transaction history"
          wide
        >
          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <Avatar name={selectedCustomer.name} size="lg" />
                  <div>
                    <h3 className="font-display text-xl font-extrabold text-slate-900">{selectedCustomer.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{selectedCustomer.contactNumber}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" />Last order: {formatDate(selectedCustomer.lastOrderDate)}</span>
                    </div>
                  </div>
                </div>
                {selectedCustomer.standing === "good" ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div><p className="text-xs font-bold uppercase tracking-wider">Good standing</p><p className="text-[11px] text-emerald-600">All orders fully settled</p></div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-rose-800">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <div><p className="text-xs font-bold uppercase tracking-wider">Has unpaid balance</p><p className="text-[11px] font-semibold text-rose-600">Outstanding: {formatCurrency(selectedCustomer.totalBalance)}</p></div>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-[11px] font-semibold text-slate-400">Total orders</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-slate-800">{selectedCustomer.totalOrders}</p>
                  <p className="text-[10px] text-slate-500">{selectedCustomer.activeOrders} active · {selectedCustomer.completedOrders} completed</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="text-[11px] font-semibold text-slate-400">Total lifetime value</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-slate-800">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  <p className="text-[10px] text-slate-500">Gross order volume</p>
                </div>
                <div className="rounded-xl bg-emerald-50/60 p-3.5">
                  <p className="text-[11px] font-semibold text-emerald-600">Total paid</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-emerald-700">{formatCurrency(selectedCustomer.totalPaid)}</p>
                  <p className="text-[10px] text-emerald-600/80">Collected payments</p>
                </div>
                <div className={cn("rounded-xl p-3.5", selectedCustomer.totalBalance > 0 ? "bg-rose-50/70" : "bg-slate-50")}>
                  <p className={cn("text-[11px] font-semibold", selectedCustomer.totalBalance > 0 ? "text-rose-600" : "text-slate-400")}>Remaining balance</p>
                  <p className={cn("mt-0.5 font-display text-lg font-bold", selectedCustomer.totalBalance > 0 ? "text-rose-700" : "text-slate-800")}>{formatCurrency(selectedCustomer.totalBalance)}</p>
                  <p className={cn("text-[10px]", selectedCustomer.totalBalance > 0 ? "text-rose-600/80" : "text-slate-500")}>{selectedCustomer.totalBalance > 0 ? "Action required" : "Zero dues"}</p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden p-5">
              <SectionHeading
                title={`Transaction History (${selectedCustomer.orders.length})`}
                subtitle={`All orders and records associated with ${selectedCustomer.name}`}
              />
              <div className="mt-4 space-y-3">
                {selectedCustomer.orders.map((order) => {
                  const orderStatus = ORDER_STATUS[order.status];
                  const paymentStatus = PAYMENT_STATUS[order.paymentStatus];
                  const isUnpaid = order.balance > 0;
                  return (
                    <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-500">{order.refNo}</span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              {order.orderType === "stock" ? "Stock Order" : "Custom Order"}
                            </span>
                            <Badge config={orderStatus} label={orderStatus.label} />
                            <Badge config={paymentStatus} label={paymentStatus.label} />
                          </div>
                          <h4 className="mt-2 text-base font-bold text-slate-900">{order.product}</h4>
                          <p className="text-xs text-slate-400">{order.category}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-display text-base font-extrabold text-slate-900">{formatCurrency(order.totalPrice)}</p>
                          <p className="text-xs text-slate-500">{order.quantity} pcs @ {formatCurrency(order.unitPrice)}</p>
                        </div>
                      </div>
                      <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-4">
                        <div><span className="block text-[10px] text-slate-400">Date ordered</span><span className="font-semibold text-slate-700">{formatDate(order.dateOrdered)}</span></div>
                        <div><span className="block text-[10px] text-slate-400">{order.status === "completed" ? "Date completed" : "Due date"}</span><span className="font-semibold text-slate-700">{formatDate(order.dateCompleted || order.dueDate)}</span></div>
                        <div><span className="block text-[10px] text-slate-400">Amount paid</span><span className="font-semibold text-emerald-600">{formatCurrency(order.amountPaid)}</span></div>
                        <div><span className="block text-[10px] text-slate-400">Balance</span><span className={cn("font-bold", isUnpaid ? "text-rose-600" : "text-slate-700")}>{formatCurrency(order.balance)}</span></div>
                      </div>
                      {order.notes && (
                        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="italic">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </Modal>
      )}
    </div>
  );
}
