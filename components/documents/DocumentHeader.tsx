"use client";

import { formatDate } from "@/lib/utils";

interface DocumentHeaderProps {
  documentName: string;
  documentType: string;
  partnerName: string;
  partnerAddress?: string;
  date: string;
  expiryDate?: string;
  origin?: string;
}

export function DocumentHeader({
  documentName,
  documentType,
  partnerName,
  partnerAddress,
  date,
  expiryDate,
  origin,
}: DocumentHeaderProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
      <div className="flex items-center justify-between bg-[var(--color-primary)] px-6 py-3">
        <h2 className="text-sm font-bold text-white font-[family-name:var(--font-heading)] uppercase tracking-wider">
          {documentType}
        </h2>
        <span className="text-sm font-semibold text-white font-[family-name:var(--font-heading)]">
          {documentName}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-6 p-6">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Bill To
          </p>
          <p className="text-base font-semibold text-[var(--color-text)]">{partnerName}</p>
          {partnerAddress && (
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{partnerAddress}</p>
          )}
        </div>
        <div className="space-y-1 text-right">
          <div>
            <span className="text-xs text-[var(--color-text-muted)]">Date: </span>
            <span className="text-sm font-medium text-[var(--color-text)]">{formatDate(date)}</span>
          </div>
          {expiryDate && (
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">Valid Until: </span>
              <span className="text-sm font-medium text-[var(--color-text)]">{formatDate(expiryDate)}</span>
            </div>
          )}
          {origin && (
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">Origin: </span>
              <span className="text-sm font-medium text-[var(--color-text)]">{origin}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
