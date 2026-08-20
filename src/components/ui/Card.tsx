import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-100 bg-white shadow-sm", className)}>{children}</div>;
}
