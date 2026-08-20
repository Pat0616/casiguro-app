import { cn, initials } from "@/lib/utils";
import { GRADIENT } from "@/lib/constants";

export default function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
  return (
    <div className={cn(GRADIENT, "flex shrink-0 items-center justify-center rounded-full font-bold text-white", sizes[size])}>
      {initials(name)}
    </div>
  );
}
