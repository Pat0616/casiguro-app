// casiguro-app/src/pages/OrderManagementPage.tsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Calendar as CalendarIcon,
  Search,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye,
} from "lucide-react";
import type { NewOrderFormData, Order, Quotation, QuotationStatus } from "@/types";
import SectionHeading from "@/components/ui/SectionHeading";
import MiniCalendar from "@/components/orders/MiniCalendar";
import DeadlinePanel from "@/components/orders/DeadlinePanel";
import NewOrderModal from "@/components/orders/NewOrderModal";
import NewQuotationModal from "@/components/quotations/NewQuotationModal";
import QuotationDetailsModal from "@/components/quotations/QuotationDetailsModal";
import { getQuotations } from "@/utils/quotationAPI";
import { GRADIENT } from "@/lib/constants";

function formatCurrency(n: number) {
  return "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface OrderManagementPageProps {
  orders: Order[];
  onCreateOrder: (data: NewOrderFormData) => void;
}

export default function OrderManagementPage({ orders, onCreateOrder }: OrderManagementPageProps) {
  const [activeTab, setActiveTab] = useState<"quotations" | "orders">("quotations");

  // Orders Tab State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Quotations Tab State
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuotationStatus>("all");

  const [newQuoteModalOpen, setNewQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoadingQuotations(true);
      const data = await getQuotations();
      setQuotations(data);
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoadingQuotations(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleQuotationCreated = (newQuote: Quotation) => {
    setQuotations((prev) => [newQuote, ...prev.filter((q) => q.id !== newQuote.id)]);
  };

  const handleQuotationStatusUpdated = (updatedQuote: Quotation) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === updatedQuote.id ? { ...q, ...updatedQuote } : q))
    );
    if (selectedQuote?.id === updatedQuote.id) {
      setSelectedQuote((prev) => (prev ? { ...prev, ...updatedQuote } : null));
    }
  };

  const handleConvertedToOrder = (newOrder: Order) => {
    // Notify parent to refresh or add to order list
    onCreateOrder({
      customerName: newOrder.customerName,
      contactNumber: newOrder.contactNumber,
      product: newOrder.product,
      category: newOrder.category,
      quantity: newOrder.quantity,
      unitPrice: newOrder.unitPrice,
      notes: newOrder.notes,
      dateOrdered: newOrder.dateOrdered,
      dueDate: newOrder.dueDate,
      orderType: newOrder.orderType,
      items: newOrder.items,
    });
    fetchQuotations();
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quoteNo.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      q.customerName.toLowerCase().includes(quoteSearch.toLowerCase()) ||
      (q.notes && q.notes.toLowerCase().includes(quoteSearch.toLowerCase()));

    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Draft
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
            <Send className="h-3 w-3 text-sky-600" />
            Sent
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Order Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pre-sale multi-item quotations, pricing approvals, and operational orders schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "quotations" ? (
            <button
              onClick={() => setNewQuoteModalOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 ${GRADIENT}`}
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </button>
          ) : (
            <button
              onClick={() => setOrderModalOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 ${GRADIENT}`}
            >
              <Plus className="h-4 w-4" />
              Direct Order
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("quotations")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition border-b-2 ${
            activeTab === "quotations"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Quotations Pipeline ({quotations.length})
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition border-b-2 ${
            activeTab === "orders"
              ? "border-pink-600 text-pink-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          Active Orders & Deadlines ({orders.length})
        </button>
      </div>

      {/* TAB 1: Quotations Workflow */}
      {activeTab === "quotations" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotes by reference, customer name, notes..."
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {(["all", "draft", "sent", "accepted", "rejected", "expired"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "all" ? "All Status" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Quotations List Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loadingQuotations ? (
              <div className="p-12 text-center text-sm text-slate-500">Loading quotations...</div>
            ) : filteredQuotations.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">
                No quotations found matching the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Quote Reference</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Items Summary</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                      <th className="px-6 py-3.5 text-right">Total Amount</th>
                      <th className="px-6 py-3.5 text-center">Valid Until</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-slate-900">{q.quoteNo}</span>
                          <span className="block text-[11px] text-slate-400">
                            {new Date(q.createdAt).toLocaleDateString("en-PH")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{q.customerName}</div>
                          {q.contactNumber && (
                            <span className="text-xs text-slate-400">{q.contactNumber}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-800 line-clamp-1">
                            {q.items && q.items.length > 0
                              ? q.items.map((it) => `${it.itemName} (×${it.quantity})`).join(", ")
                              : "No items"}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {q.items?.length || 0} line {q.items?.length === 1 ? "item" : "items"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(q.status)}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(q.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-slate-600">
                          {q.validUntil}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedQuote(q);
                              setDetailsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-pink-600 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Proposal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Operational Orders & Delivery Deadlines */}
      {activeTab === "orders" && (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="order-2 w-full lg:order-1 lg:w-[68%] xl:w-[70%]">
            <DeadlinePanel
              orders={orders}
              selectedDate={selectedDate}
              onClear={() => setSelectedDate(null)}
            />
          </div>
          <div className="order-1 w-full lg:order-2 lg:w-[32%] xl:w-[30%]">
            <MiniCalendar
              orders={orders}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        </div>
      )}

      {/* New Direct Order Modal */}
      <NewOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onCreate={(data) => {
          onCreateOrder(data);
          setOrderModalOpen(false);
        }}
      />

      {/* New Multi-Item Quotation Modal */}
      <NewQuotationModal
        open={newQuoteModalOpen}
        onClose={() => setNewQuoteModalOpen(false)}
        onCreated={handleQuotationCreated}
      />

      {/* Quotation Details Modal */}
      <QuotationDetailsModal
        quotation={selectedQuote}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedQuote(null);
        }}
        onStatusUpdated={handleQuotationStatusUpdated}
        onConvertedToOrder={handleConvertedToOrder}
        onEditAndResend={(quote) => {
          // Open new quotation modal with prefilled data or edit
          setNewQuoteModalOpen(true);
        }}
      />
    </div>
  );
}
