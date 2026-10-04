import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, pad, TODAY_KEY } from "@/lib/utils";
import { GRADIENT, NOW } from "@/lib/constants";
import type { Order } from "@/types";
import Card from "@/components/ui/Card";

interface MiniCalendarProps {
  orders: Order[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export default function MiniCalendar({ orders, selectedDate, onSelectDate }: MiniCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(new Date(NOW.getFullYear(), NOW.getMonth(), 1));

  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders
      .filter((o) => o.status !== "completed")
      .forEach((o) => {
        map[o.dueDate] = map[o.dueDate] || [];
        map[o.dueDate].push(o);
      });
    return map;
  }, [orders]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-slate-900">
          {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMonthCursor(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonthCursor(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${year}-${pad(month + 1)}-${pad(d)}`;
          const hasDeadline = !!ordersByDate[key];
          const isToday = key === TODAY_KEY;
          const isSelected = key === selectedDate;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition",
                isSelected
                  ? "bg-sky-600 text-white shadow-sm"
                  : hasDeadline
                  ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
                  : "text-slate-600 hover:bg-slate-50",
                isToday && !isSelected && "ring-2 ring-sky-300"
              )}
            >
              {d}
              {hasDeadline && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sky-500" />}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Has deadline</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full ring-2 ring-sky-300" /> Today</span>
      </div>
    </Card>
  );
}
