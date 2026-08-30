import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export default function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none";
  const sizes = { md: "px-4 py-2.5 text-sm", sm: "px-3 py-2 text-xs", lg: "px-5 py-3 text-sm" };
  const variants = {
    primary: cn(GRADIENT, "text-white shadow-sm shadow-pink-200 hover:shadow-md hover:brightness-105 active:brightness-95"),
    secondary: "bg-white text-slate-700 border border-slate-300 hover:border-slate-400 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
