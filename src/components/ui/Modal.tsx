import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
  fullScreen?: boolean;
}

export default function Modal({ open, onClose, title, subtitle, children, wide, fullScreen }: ModalProps) {
  useEffect(() => {
    if (!open || !fullScreen) return;
    const previousOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [open, fullScreen]);

  if (!open) return null;
  const modal = (
    <div className={cn("fixed inset-0 z-50", fullScreen ? "grid h-dvh w-screen place-items-center overflow-hidden p-3 sm:p-6" : "overflow-y-auto")}>
      <div className={cn("fixed inset-0 bg-slate-900/50", fullScreen && "backdrop-blur-sm")} onClick={onClose} />
      <div className={cn("relative flex items-center justify-center", fullScreen ? "h-full w-full overflow-hidden" : "min-h-full p-4")}>
        <div className={cn(
          "relative w-full rounded-3xl border border-slate-200 bg-white shadow-xl",
          fullScreen
            ? "flex h-full max-w-none flex-col overflow-hidden rounded-2xl"
            : wide
              ? "flex max-h-[94vh] max-w-6xl flex-col"
              : "max-w-lg"
        )}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className={cn("px-6 py-5", wide && !fullScreen && "min-h-0 overflow-y-auto", fullScreen && "min-h-0 flex-1 overflow-hidden")}>{children}</div>
        </div>
      </div>
    </div>
  );
  return fullScreen ? createPortal(modal, document.body) : modal;
}
