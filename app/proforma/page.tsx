"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchQuotations } from "@/lib/odoo/sale";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { SaleOrder } from "@/types/odoo";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type ProformaFilter = "all" | "has_po" | "has_invoice" | "has_delivery";

export default function ProformaPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProformaFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchQuotations();
      setOrders(data.filter((o) => o.state === "sale"));
    } catch (err) {
      console.error("Failed to load proformas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadOrders();
  }, [session, loadOrders]);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.partner_id[1].toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (filter === "has_po") matchesFilter = (o.invoice_ids?.length ?? 0) === 0 && (o.picking_ids?.length ?? 0) === 0;
    else if (filter === "has_invoice") matchesFilter = (o.invoice_ids?.length ?? 0) > 0;
    else if (filter === "has_delivery") matchesFilter = (o.picking_ids?.length ?? 0) > 0;

    return matchesSearch && matchesFilter;
  });

  const hasPoCount = orders.filter((o) => (o.invoice_ids?.length ?? 0) === 0 && (o.picking_ids?.length ?? 0) === 0).length;
  const hasInvoiceCount = orders.filter((o) => (o.invoice_ids?.length ?? 0) > 0).length;
  const hasDeliveryCount = orders.filter((o) => (o.picking_ids?.length ?? 0) > 0).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pagedOrders = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: ProformaFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedOrders.length && pagedOrders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedOrders.map((o) => o.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const tabs = [
    { key: "all" as ProformaFilter, label: "All", count: orders.length },
    { key: "has_po" as ProformaFilter, label: "Pending", count: hasPoCount },
    { key: "has_invoice" as ProformaFilter, label: "Invoiced", count: hasInvoiceCount },
    { key: "has_delivery" as ProformaFilter, label: "Delivered", count: hasDeliveryCount },
  ];

  return (
    <div className="w-full px-8 space-y-2">
      <div className="h-[64px] flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Proforma Invoices
        </h1>
      </div>

      <div className="flex gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
            }`}
          >
            {tab.label} ({tab.count})
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
          placeholder="Search by order number or customer..."
          value={search}
          onChange={handleSearchChange}
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
                  <th className="px-4 py-1.5 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--color-hairline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      checked={selectedIds.size === pagedOrders.length && pagedOrders.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Number</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-[35%]">Customer</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Reference Number</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Order Date</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {pagedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/proforma/${order.id}`)}
                    className="hover:bg-[var(--color-surface-soft)] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--color-hairline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                      />
                    </td>
                    <td className="px-4 py-2 font-semibold text-[var(--color-ink)]">PRO-{order.name}</td>
                    <td className="px-4 py-2 text-[var(--color-ink)]">{order.partner_id[1]}</td>
                    <td className="px-4 py-2 text-[var(--color-muted)] text-sm">{order.client_order_ref || "-"}</td>
                    <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{formatDate(order.date_order)}</td>
                    <td className="px-4 py-2">
                      <Badge state={order.state} />
                    </td>
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/proforma/${order.id}`}
                        className="font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {formatCurrency(order.amount_total)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--color-surface-soft)] border-t border-[var(--color-hairline)]">
                <tr>
                  <td colSpan={6} className="px-4 py-1.5 text-right text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Total:
                  </td>
                  <td className="px-4 py-1.5 text-right font-bold text-[14px] text-[var(--color-ink)]">
                    {formatCurrency(filtered.reduce((sum, o) => sum + o.amount_total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">
              No confirmed orders found
            </div>
          )}
        </div>
      )}

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
