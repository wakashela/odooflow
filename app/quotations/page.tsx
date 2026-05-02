"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchQuotations } from "@/lib/odoo/sale";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SaleOrder } from "@/types/odoo";
import { Plus, Search } from "lucide-react";

export default function QuotationsPage() {
  const { session } = useAuthStore();
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");

  useEffect(() => {
    if (session) {
      loadOrders();
    }
  }, [session]);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchQuotations();
      setOrders(data);
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.partner_id[1].toLowerCase().includes(search.toLowerCase());
    const matchesState = stateFilter === "all" || o.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const draftCount = orders.filter((o) => o.state === "draft").length;
  const sentCount = orders.filter((o) => o.state === "sent").length;
  const saleCount = orders.filter((o) => o.state === "sale").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Quotations
        </h1>
        <Link href="/quotations/new">
          <Button size="md">
            <Plus size={16} />
            New Quotation
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        {[
          { key: "all", label: "All", count: orders.length },
          { key: "draft", label: "Draft", count: draftCount },
          { key: "sent", label: "Sent", count: sentCount },
          { key: "sale", label: "Confirmed", count: saleCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStateFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stateFilter === tab.key
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
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by name or customer..."
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
          {filtered.map((order) => (
            <Link key={order.id} href={`/quotations/${order.id}`}>
              <Card padding="none" className="hover:shadow-md transition-shadow mb-2">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                        {order.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {order.partner_id[1]}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(order.date_order)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                      {formatCurrency(order.amount_total)}
                    </span>
                    <Badge state={order.state} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">
              No quotations found
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
