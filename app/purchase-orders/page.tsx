"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchPurchaseOrders } from "@/lib/odoo/purchase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { PurchaseOrder } from "@/types/odoo";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const STATE_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "purchase", label: "Confirmed" },
  { key: "done", label: "Done" },
  { key: "cancel", label: "Cancelled" },
];

export default function PurchaseOrdersPage() {
  const { session } = useAuthStore();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (session) {
      loadOrders();
    }
  }, [session]);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchPurchaseOrders();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter((po) => {
    const matchesSearch =
      !search ||
      po.name.toLowerCase().includes(search.toLowerCase()) ||
      po.partner_id[1].toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === "all" || po.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const counts: Record<string, number> = { all: orders.length };
  for (const po of orders) {
    counts[po.state] = (counts[po.state] || 0) + 1;
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedOrders = filtered.slice(
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
          Purchase Orders
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
          placeholder="Search by PO number or vendor..."
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
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-[35%]">Vendor</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Order Date</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {pagedOrders.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => window.location.href = `/purchase-orders/${po.id}`}
                    className="hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2 font-semibold text-[var(--color-ink)]">{po.name}</td>
                    <td className="px-4 py-2 text-[var(--color-ink)]">{po.partner_id[1]}</td>
                    <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{formatDate(po.date_order)}</td>
                    <td className="px-4 py-2"><Badge state={po.state} /></td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/purchase-orders/${po.id}`} className="font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors" onClick={(e) => e.stopPropagation()}>
                        {formatCurrency(po.amount_total)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--color-surface-soft)] border-t border-[var(--color-hairline)]">
                <tr>
                  <td colSpan={4} className="px-4 py-1.5 text-right text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-4 py-1.5 text-right font-bold text-[14px] text-[var(--color-ink)]">
                    TZS {formatCurrency(filtered.reduce((sum, po) => sum + po.amount_total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">
              No purchase orders found
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
