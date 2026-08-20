import { useState } from "react";
import { Bell, Clock, Edit3, RefreshCcw, ShoppingBag, LucideIcon } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";
import type { AppNotification, NotificationType } from "@/types";
import Card from "@/components/ui/Card";
import SectionHeading from "@/components/ui/SectionHeading";
import EmptyState from "@/components/ui/EmptyState";

const NOTIF_ICON: Record<NotificationType, { icon: LucideIcon; tint: string }> = {
  new_order: { icon: ShoppingBag, tint: "text-sky-600 bg-sky-50" },
  status_update: { icon: RefreshCcw, tint: "text-violet-600 bg-violet-50" },
  detail_update: { icon: Edit3, tint: "text-amber-600 bg-amber-50" },
};

const FILTERS: { key: NotificationType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new_order", label: "New Orders" },
  { key: "status_update", label: "Status Updates" },
  { key: "detail_update", label: "Detail Updates" },
];

export default function NotificationsPage({ notifications }: { notifications: AppNotification[] }) {
  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const list = notifications.filter((n) => filter === "all" || n.type === filter).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Activity Log" title="Notifications" />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === f.key ? cn(GRADIENT, "text-white") : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-2">
        {list.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Bell} title="No activity" subtitle="Nothing to show for this filter yet." />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((n) => {
              const meta = NOTIF_ICON[n.type];
              return (
                <div key={n.id} className="flex items-start gap-3.5 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.tint)}>
                    <meta.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-bold">{n.user}</span>{" "}
                      {n.type === "new_order" ? "created a new order" : n.type === "status_update" ? "updated an order's status" : "updated an order's details"}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      <span className="font-mono text-xs text-slate-400">{n.orderRef}</span> · {n.customerName} — {n.detail}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" /> {relativeTime(n.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
