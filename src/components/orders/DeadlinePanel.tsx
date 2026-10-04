import {
  CalendarClock,
  Calendar,
  Clock,
  FileText,
  Phone,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  X,
} from "lucide-react";
import { cn, dueLabel, formatCurrency, formatDate } from "@/lib/utils";
import { GRADIENT, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import type { Order } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";

interface DeadlinePanelProps {
  orders: Order[];
  selectedDate: string | null;
  onClear: () => void;
}

export default function DeadlinePanel({ orders, selectedDate, onClear }: DeadlinePanelProps) {
  const active = orders.filter((o) => o.status !== "completed");
  const list = selectedDate
    ? active.filter((o) => o.dueDate === selectedDate).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    : [...active].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  // Calculate urgency tallies
  const overdueCount = active.filter((o) => dueLabel(o.dueDate).urgency === "overdue").length;
  const dueTodayCount = active.filter((o) => dueLabel(o.dueDate).urgency === "today").length;
  const dueTomorrowCount = active.filter((o) => dueLabel(o.dueDate).urgency === "tomorrow").length;

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {selectedDate ? `Deadlines for ${formatDate(selectedDate)}` : "Production Deadlines"}
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {list.length} {list.length === 1 ? "order" : "orders"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {selectedDate
                  ? `Showing active orders scheduled for completion on this day`
                  : `Sorted by deadline urgency to help prioritize daily workflow`}
              </p>
            </div>
          </div>
        </div>

        {selectedDate ? (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-sky-600 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
            Show All Deadlines
          </button>
        ) : (
          /* Urgency Quick Counters */
          <div className="flex flex-wrap items-center gap-2">
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-sm shadow-rose-200 animate-pulse">
                <Flame className="h-3.5 w-3.5" />
                {overdueCount} OVERDUE
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white shadow-sm shadow-amber-200">
                <Clock className="h-3.5 w-3.5" />
                {dueTodayCount} DUE TODAY
              </span>
            )}
            {dueTomorrowCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900 border border-orange-200">
                <Clock className="h-3.5 w-3.5 text-orange-700" />
                {dueTomorrowCount} Due Tomorrow
              </span>
            )}
          </div>
        )}
      </div>

      {/* Orders List */}
      {list.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={CalendarClock}
            title={selectedDate ? "No deadlines on this date" : "No active deadlines"}
            subtitle={
              selectedDate
                ? "There are no active orders due on the selected date."
                : "All production orders are complete."
            }
          />
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-1">
          {list.map((o) => {
            const due = dueLabel(o.dueDate);
            const cfg = ORDER_STATUS[o.status];
            const pcfg = PAYMENT_STATUS[o.paymentStatus];
            const progress =
              o.quantity > 0 ? Math.min(100, Math.round((o.quantityCompleted / o.quantity) * 100)) : 0;

            const isOverdue = due.urgency === "overdue";
            const isToday = due.urgency === "today";
            const isTomorrow = due.urgency === "tomorrow";
            const isSoon = due.urgency === "soon";

            return (
              <div
                key={o.id}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md",
                  isOverdue && "border-l-[6px] border-l-rose-600 border-rose-200 bg-rose-50/25 ring-1 ring-rose-200/50",
                  isToday && "border-l-[6px] border-l-amber-500 border-amber-200 bg-amber-50/25 ring-1 ring-amber-200/50",
                  isTomorrow && "border-l-[6px] border-l-orange-400 border-orange-200 bg-orange-50/15",
                  isSoon && "border-l-[4px] border-l-amber-300 border-slate-100",
                  !isOverdue && !isToday && !isTomorrow && !isSoon && "border-slate-100"
                )}
              >
                {/* HIGH-VISIBILITY TOP URGENCY BANNER */}
                {isOverdue && (
                  <div className="flex items-center justify-between bg-rose-600 px-4 py-2 text-white shadow-inner">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                      <span className="font-display text-xs font-black uppercase tracking-wider">
                        CRITICAL DEADLINE · OVERDUE BY {Math.abs(due.daysDiff)} DAY{Math.abs(due.daysDiff) === 1 ? "" : "S"}
                      </span>
                    </div>
                    <span className="rounded bg-rose-700/80 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                      Due: {formatDate(o.dueDate)}
                    </span>
                  </div>
                )}

                {isToday && (
                  <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-white shadow-inner">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 animate-pulse" />
                      <span className="font-display text-xs font-black uppercase tracking-wider">
                        ACTION REQUIRED · DUE TODAY
                      </span>
                    </div>
                    <span className="rounded bg-amber-600/80 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                      Due Today ({formatDate(o.dueDate)})
                    </span>
                  </div>
                )}

                {isTomorrow && (
                  <div className="flex items-center justify-between bg-orange-500 px-4 py-1.5 text-white">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="font-display text-xs font-bold uppercase tracking-wider">
                        DUE TOMORROW
                      </span>
                    </div>
                    <span className="text-[11px] font-bold">
                      {formatDate(o.dueDate)}
                    </span>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  {/* Top Row: Customer info, Reference code, Status badges */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar name={o.customerName} size="md" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-bold text-slate-900">
                            {o.customerName}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-400">
                            ({o.refNo})
                          </span>
                        </div>
                        {o.contactNumber && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {o.contactNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {o.orderType === "stock" ? "Stock" : "Custom"}
                      </span>
                      <Badge config={cfg} label={cfg.label} />
                      <Badge config={pcfg} label={pcfg.label} />
                    </div>
                  </div>

                  {/* Middle Row: Product Name, Price, and Progress Bar */}
                  <div className="mt-3.5 flex flex-col justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{o.product}</h4>
                      <p className="text-xs text-slate-400">{o.category}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="font-display text-base font-extrabold text-slate-900">
                        {formatCurrency(o.totalPrice)}
                      </span>
                      <span className="ml-1.5 text-xs text-slate-500">
                        ({o.items && o.items.length > 1 ? `${o.items.length} items · ` : ""}{o.quantity} pcs)
                      </span>
                    </div>
                  </div>

                  {/* Production Progress Bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Production Progress: {o.quantityCompleted} / {o.quantity} pcs completed</span>
                      <span className="font-bold text-slate-700">
                        {o.overallProgress !== undefined ? o.overallProgress : (o.quantity > 0 ? Math.round((o.quantityCompleted / o.quantity) * 100) : 0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(GRADIENT, "h-full rounded-full transition-all duration-300")}
                        style={{
                          width: `${
                            o.overallProgress !== undefined
                              ? o.overallProgress
                              : o.quantity > 0
                              ? Math.round((o.quantityCompleted / o.quantity) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom Details Grid: Date Ordered, EMPHASIZED Due Date, Financials */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Calendar className="h-3 w-3" /> Date Ordered
                      </span>
                      <span className="mt-1 block font-semibold text-slate-700">
                        {formatDate(o.dateOrdered)}
                      </span>
                    </div>

                    {/* EMPHASIZED DUE DATE BOX */}
                    <div
                      className={cn(
                        "rounded-lg p-1.5 -m-1 transition-all",
                        isOverdue && "bg-rose-100/90 border border-rose-300 ring-2 ring-rose-200/60",
                        isToday && "bg-amber-100/90 border border-amber-300 ring-2 ring-amber-200/60",
                        isTomorrow && "bg-orange-100/80 border border-orange-300",
                        isSoon && "bg-amber-50 border border-amber-200",
                        !isOverdue && !isToday && !isTomorrow && !isSoon && "bg-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                          isOverdue && "text-rose-800",
                          isToday && "text-amber-800",
                          isTomorrow && "text-orange-800",
                          isSoon && "text-amber-700",
                          !isOverdue && !isToday && !isTomorrow && !isSoon && "text-slate-400"
                        )}
                      >
                        <Clock className="h-3 w-3" /> Due Date
                      </span>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        <span
                          className={cn(
                            "font-extrabold",
                            isOverdue ? "text-rose-900 text-sm" : isToday ? "text-amber-900 text-sm" : "text-slate-800"
                          )}
                        >
                          {formatDate(o.dueDate)}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight",
                            due.badge
                          )}
                        >
                          {due.text}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <CheckCircle2 className="h-3 w-3" /> Amount Paid
                      </span>
                      <span className="mt-1 block font-semibold text-emerald-600">
                        {formatCurrency(o.amountPaid)}
                      </span>
                    </div>

                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <AlertCircle className="h-3 w-3" /> Remaining Balance
                      </span>
                      <span
                        className={cn(
                          "mt-1 block font-bold",
                          o.balance > 0 ? "text-rose-600" : "text-slate-700"
                        )}
                      >
                        {formatCurrency(o.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Notes if present */}
                  {o.notes && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="italic">{o.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
