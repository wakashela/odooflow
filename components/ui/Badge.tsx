import { cn } from "@/lib/utils";
import type { DocumentState } from "@/types/documents";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[var(--color-border-light)] text-[var(--color-text-muted)]",
  sent: "bg-[var(--color-info-light)] text-[var(--color-info)]",
  sale: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
  posted: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  done: "bg-[var(--color-success-light)] text-emerald-800",
  cancel: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  purchase: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
  confirmed: "bg-blue-50 text-blue-700",
  assigned: "bg-indigo-50 text-indigo-700",
  waiting: "bg-amber-50 text-amber-700",
  not_paid: "bg-red-50 text-red-700",
  paid: "bg-green-50 text-green-700",
  partial: "bg-yellow-50 text-yellow-700",
};

const DISPLAY_LABELS: Record<string, string> = {
  sale: "confirmed",
  not_paid: "NOT PAID",
  paid: "FULL PAID",
  partial: "PARTIAL PAYMENT",
};

interface BadgeProps {
  state: string;
  className?: string;
}

export function Badge({ state, className }: BadgeProps) {
  const style = STATUS_STYLES[state] || STATUS_STYLES.draft;
  const displayLabel = DISPLAY_LABELS[state] || state;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        style,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
