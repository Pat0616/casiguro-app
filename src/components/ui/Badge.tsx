import { cn } from "@/lib/utils";

interface BadgeProps {
  config: { label: string; badge: string; dot?: string };
  label: string;
}

export default function Badge({ config, label }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", config.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot || "bg-current")} />
      {label}
    </span>
  );
}
