"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchInvoices } from "@/lib/odoo/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { AccountMove } from "@/types/odoo";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const STATE_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "posted", label: "Posted" },
  { key: "cancel", label: "Cancelled" },
];

const PAYMENT_LABELS: Record<string, string> = {
  not_paid: "Not Paid",
  in_payment: "In Payment",
  paid: "Paid",
  partial: "Partial",
  reversed: "Reversed",
};

export default function InvoicesPage() {
  const { session } = useAuthStore();
  const [invoices, setInvoices] = useState<AccountMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (session) {
      loadInvoices();
    }
  }, [session]);

  async function loadInvoices() {
    try {
      setLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.partner_id[1].toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === "all" || inv.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const counts: Record<string, number> = { all: invoices.length };
  for (const inv of invoices) {
    counts[inv.state] = (counts[inv.state] || 0) + 1;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedInvoices = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, stateFilter]);

  return (
    <div className="w-full px-8 space-y-2">
      <div className="h-[64px] flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Tax Invoices
        </h1>
      </div>

      <div className="flex gap-3">
        {STATE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStateFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stateFilter === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
            }`}
          >
            {tab.label} ({counts[tab.key] || 0})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          type="text"
          placeholder="Search by invoice number or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[40px] rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] pl-12 pr-4 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:border-2 focus:outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-hairline)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-hairline)]">
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Number</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-[35%]">Customer</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Invoice Date</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {pagedInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => window.location.href = `/invoices/${inv.id}`}
                    className="hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2 font-semibold text-[var(--color-ink)]">{inv.name}</td>
                    <td className="px-4 py-2 text-[var(--color-ink)]">{inv.partner_id[1]}</td>
                    <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">
                      {inv.payment_state ? <Badge state={inv.payment_state} /> : "-"}
                    </td>
                    <td className="px-4 py-2"><Badge state={inv.state} /></td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/invoices/${inv.id}`} className="font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors" onClick={(e) => e.stopPropagation()}>
                        {formatCurrency(inv.amount_total)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--color-surface-soft)] border-t border-[var(--color-hairline)]">
                <tr>
                  <td colSpan={5} className="px-4 py-1.5 text-right text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-4 py-1.5 text-right font-bold text-[14px] text-[var(--color-ink)]">
                    TZS {formatCurrency(filtered.reduce((sum, inv) => sum + inv.amount_total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">
              No invoices found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--color-muted)]">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-[36px] rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
