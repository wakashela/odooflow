"use client";

import { formatDate } from "@/lib/utils";
import type { CompanySettings } from "@/types/settings";

interface DocumentHeaderProps {
  documentName: string;
  documentType: string;
  partnerName: string;
  partnerAddress?: string;
  date: string;
  expiryDate?: string;
  origin?: string;
  company?: CompanySettings | null;
  onEditCustomer?: () => void;
}

export function DocumentHeader({
  documentName,
  documentType,
  partnerName,
  partnerAddress,
  date,
  expiryDate,
  origin,
  company,
  onEditCustomer,
}: DocumentHeaderProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
      <div className="flex items-start gap-4 p-6">
        <div className="w-[150px] h-[150px] flex items-center justify-center overflow-hidden rounded-md">
          <img src="/logo.png" alt="Company logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold uppercase tracking-wide text-[var(--color-text)]">
            {company?.name?.toUpperCase() || ""}
          </div>
          <div className="mt-2 text-sm text-[var(--color-text-muted)] space-y-1">
            <div>{company?.vat || ""}</div>
            <div>{[company?.street, company?.street2, company?.city, company?.zip].filter(Boolean).join(", ")}</div>
            <div>{[company?.phone, company?.email].filter(Boolean).join(" | ")}</div>
          </div>
        </div>
      </div>
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
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Bill To
            </p>
            {onEditCustomer && (
              <button
                onClick={onEditCustomer}
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
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