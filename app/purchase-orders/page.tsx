"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPurchaseOrders } from "@/lib/odoo/purchase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PurchaseOrder } from "@/types/odoo";
import { Search } from "lucide-react";

const STATE_TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "purchase", label: "Confirmed" },
  { key: "done", label: "Done" },
  { key: "cancel", label: "Cancelled" },
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by PO number or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((po) => (
            <Link key={po.id} href={`/purchase-orders/${po.id}`}>
              <Card padding="none" className="hover:shadow-md transition-shadow mb-2">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                        {po.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {po.partner_id[1]}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(po.date_order)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                      {formatCurrency(po.amount_total)}
                    </span>
                    <Badge state={po.state} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">
              No purchase orders found
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
