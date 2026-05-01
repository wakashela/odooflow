"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchQuotations } from "@/lib/odoo/sale";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { SaleOrder } from "@/types/odoo";
import { Search } from "lucide-react";

export default function ProformaPage() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await fetchQuotations();
      setOrders(data.filter((o) => o.state === "sale"));
    } catch (err) {
      console.error("Failed to load proformas:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.partner_id[1].toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Proforma Invoices
        </h1>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by order number or customer..."
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
            <Link key={order.id} href={`/proforma/${order.id}`}>
              <Card padding="none" className="hover:shadow-md transition-shadow mb-2">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                        PRO-{order.name}
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
              No confirmed orders to generate proforma from
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
