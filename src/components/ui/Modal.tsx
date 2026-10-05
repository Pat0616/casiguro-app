import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, subtitle, children, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={cn("relative w-full rounded-3xl border border-slate-200 bg-white shadow-xl", wide ? "flex max-h-[94vh] max-w-6xl flex-col" : "max-w-lg")}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={cn("px-6 py-5", wide && "min-h-0 overflow-y-auto")}>{children}</div>
        </div>
      </div>
    </div>
  );
}
