import type { BankDetail } from "@/types/settings";

interface BankDetailsProps {
  banks?: BankDetail[];
}

export function BankDetails({ banks }: BankDetailsProps) {
  const bank = banks?.[0];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="mb-4 text-sm font-bold text-[var(--color-text)] pb-2 border-b border-[var(--color-border)]">
        Bank Details
      </h3>
      {bank ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-[var(--color-text)] w-24">Bank:</span>
            <span className="text-[var(--color-text)]">{bank.bank_name || "-"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-[var(--color-text)] w-24">Beneficiary:</span>
            <span className="text-[var(--color-text)]">{bank.acc_holder_name || "-"}</span>
          </div>
          {bank.x_tzs_account && (
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-text)] w-24">TZS Account:</span>
              <span className="text-[var(--color-text)]">{bank.x_tzs_account}</span>
            </div>
          )}
          {bank.x_usd_account && (
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-text)] w-24">USD Account:</span>
              <span className="text-[var(--color-text)]">{bank.x_usd_account}</span>
            </div>
          )}
          {bank.bank_bic && (
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-text)] w-24">Swift/BIC:</span>
              <span className="text-[var(--color-text)]">{bank.bank_bic}</span>
            </div>
          )}
          {bank.x_branch && (
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-text)] w-24">Branch:</span>
              <span className="text-[var(--color-text)]">{bank.x_branch}</span>
            </div>
          )}
          {bank.x_sort_code && (
            <div className="flex gap-2">
              <span className="font-semibold text-[var(--color-text)] w-24">Sort Code:</span>
              <span className="text-[var(--color-text)]">{bank.x_sort_code}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">No bank details available.</p>
      )}
    </div>
  );
}