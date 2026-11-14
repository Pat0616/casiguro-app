import { cn } from "@/lib/utils";

// The company logo from public/. The 500x500 image has empty margins; its artwork (swoosh + name) is a 418x178
// box at its centre, so the box keeps that ratio and the background is scaled to 500/418 to crop the margins.
const LOGO_SRC = "/CasiguroEnterpriseLogo.webp";

export default function Logo({ compact }: { compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Casiguro Enterprises, Inc."
      className={cn("shrink-0 bg-center bg-no-repeat", compact ? "h-9" : "h-12")}
      style={{ aspectRatio: "418 / 178", backgroundImage: `url(${LOGO_SRC})`, backgroundSize: `${(500 / 418) * 100}% auto` }}
    />
  );
}
