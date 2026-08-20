import { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}

export default function SectionHeading({ eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wider text-pink-600">{eyebrow}</p>}
        <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}
