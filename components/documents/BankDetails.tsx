export function BankDetails() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-6">
      <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
        Bank Details
      </h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-[var(--color-text-muted)]">Bank: </span>
          <span className="font-medium text-[var(--color-text)]">CRDB BANK</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">Swift: </span>
          <span className="font-medium text-[var(--color-text)]">CORUTZTZ</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">Account: </span>
          <span className="font-medium text-[var(--color-text)]">015C001GAEC00</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">Branch: </span>
          <span className="font-medium text-[var(--color-text)]">UDSM</span>
        </div>
        <div>
          <span className="text-[var(--color-text-muted)]">Sort Code: </span>
          <span className="font-medium text-[var(--color-text)]">3386</span>
        </div>
      </div>
    </div>
  );
}
