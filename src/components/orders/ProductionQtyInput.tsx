// casiguro-app/src/components/orders/ProductionQtyInput.tsx
// "Add finished pcs" entry for one order item: staff enter what was finished since the last update (negative to correct
// an earlier count) and see the new total. The parent keeps the typed text and turns it into quantityCompleted.
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Typed amount → number; an empty box (or a lone "-") counts as 0 */
export function parseAdded(text: string) {
  if (text === "" || text === "-") return 0;
  return Number(text) || 0;
}

interface ProductionQtyInputProps {
  quantity: number;
  /** Server value the edit started from */
  completedBefore: number;
  value: string;
  onChange: (text: string) => void;
  onUndo: () => void;
}

const stepButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-pink-300 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700";
const chip =
  "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-700";

export default function ProductionQtyInput({ quantity, completedBefore, value, onChange, onUndo }: ProductionQtyInputProps) {
  const added = parseAdded(value);
  const maxAdd = quantity - completedBefore;
  const minAdd = -completedBefore;
  const total = completedBefore + added;
  const left = quantity - total;
  const allDoneBefore = maxAdd <= 0;

  const set = (n: number) => onChange(String(Math.max(minAdd, Math.min(maxAdd, n))));
  const finish = () => {
    if (value === "" || value === "-") onChange("0");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">Add finished pcs</span>
        <span className="text-[11px] text-slate-400">
          {allDoneBefore ? `All ${quantity} pcs done` : `Up to ${maxAdd} more`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => set(added - 1)} disabled={added <= minAdd} aria-label="Finished one less" className={stepButton}>
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={value}
            onChange={(e) => {
              const text = e.target.value.trim();
              if (!/^-?\d*$/.test(text)) return;
              if (text === "" || text === "-") onChange(text);
              else set(Number(text));
            }}
            onBlur={finish}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                finish();
              }
            }}
            aria-label="Pieces finished since the last update"
            className="h-11 w-28 rounded-xl border border-slate-300 bg-white px-3 text-center font-mono text-lg font-bold text-slate-900 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          />
          <button type="button" onClick={() => set(added + 1)} disabled={added >= maxAdd} aria-label="Finished one more" className={stepButton}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 5, 10, 50].map((step) => (
            <button key={step} type="button" onClick={() => set(added + step)} disabled={added + step > maxAdd} className={chip}>
              +{step}
            </button>
          ))}
          <button type="button" onClick={() => set(maxAdd)} disabled={allDoneBefore || added === maxAdd} className={chip}>
            Rest ({Math.max(0, maxAdd)})
          </button>
        </div>
      </div>

      {added !== 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs",
            added < 0 ? "border border-amber-200 bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600"
          )}
        >
          <span>
            {added < 0 ? `Correction: removing ${-added} pcs → ` : `New total: ${completedBefore} → `}
            <strong className="font-mono text-slate-900">
              {total} / {quantity}
            </strong>
            {left > 0 ? ` · ${left} left` : " · all done"}
          </span>
          <button type="button" onClick={onUndo} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-pink-700">
            <RotateCcw className="h-3 w-3" /> Undo
          </button>
        </div>
      )}
    </div>
  );
}
