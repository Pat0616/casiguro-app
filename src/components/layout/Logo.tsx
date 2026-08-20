import { cn } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";

export default function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className={cn(GRADIENT, "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-extrabold text-white")}>
        C
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-display text-base font-extrabold text-slate-900">CASIGURO</p>
          <p className="text-[11px] font-semibold tracking-widest text-slate-400">ENTERPRISES, INC.</p>
        </div>
      )}
    </div>
  );
}
