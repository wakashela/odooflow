"use client";

import { formatCurrency } from "@/lib/utils";

interface TotalsBlockProps {
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  discount?: number;
  currency?: string;
}

export function TotalsBlock({
  amountUntaxed,
  amountTax,
  amountTotal,
  discount,
  currency = "TZS",
}: TotalsBlockProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
      <div className="divide-y divide-[var(--color-border-light)]">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-sm text-[var(--color-text-muted)]">Subtotal</span>
          <span className="text-sm font-medium font-[family-name:var(--font-heading)] text-[var(--color-text)]">
            {currency} {formatCurrency(amountUntaxed).replace(/^[A-Z]+\s/, "")}
          </span>
        </div>
        {discount !== undefined && discount > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-row-alt)]">
            <span className="text-sm text-[var(--color-text-muted)]">Discount</span>
            <span className="text-sm font-medium font-[family-name:var(--font-heading)] text-[var(--color-danger)]">
              -{currency} {formatCurrency(discount).replace(/^[A-Z]+\s/, "")}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-sm text-[var(--color-text-muted)]">Tax (18% VAT)</span>
          <span className="text-sm font-medium font-[family-name:var(--font-heading)] text-[var(--color-text)]">
            {currency} {formatCurrency(amountTax).replace(/^[A-Z]+\s/, "")}
          </span>
        </div>
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-primary-light)]">
          <span className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-primary)]">
            Total
          </span>
          <span className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--color-primary)]">
            {currency} {formatCurrency(amountTotal).replace(/^[A-Z]+\s/, "")}
          </span>
        </div>
      </div>
    </div>
  );
}
