import { CalendarClock } from "lucide-react";
import { cn, dueLabel, formatDate } from "@/lib/utils";
import { ORDER_STATUS } from "@/lib/constants";
import type { Order } from "@/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
    : [...active].sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).slice(0, 8);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-900">
          {selectedDate ? `Due on ${formatDate(selectedDate)}` : "Upcoming Deadlines"}
        </h3>
        {selectedDate && (
          <button onClick={onClear} className="text-xs font-semibold text-sky-600 hover:text-sky-700">Clear</button>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No deadlines here" subtitle="Nothing due on this date." />
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {list.map((o) => {
            const due = dueLabel(o.dueDate);
            const cfg = ORDER_STATUS[o.status];
            return (
              <div key={o.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{o.customerName}</p>
                    <p className="truncate text-xs text-slate-400">{o.product}</p>
                  </div>
                  <Badge config={cfg} label={cfg.label} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={cn("text-xs font-semibold", due.tone)}>{due.text}</span>
                  <span className="text-xs text-slate-400">{Math.round((o.quantityCompleted / o.quantity) * 100)}% done</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
