"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { odooCall } from "@/lib/odoo/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaleOrder, AccountMove, PurchaseOrder, StockPicking } from "@/types/odoo";
import { FileText, Receipt, ShoppingCart, Truck, ArrowRight } from "lucide-react";
import Link from "next/link";

interface KpiCard {
  label: string;
  count: number;
  total: string;
  href: string;
  icon: React.ElementType;
  color: string;
  stateFilter?: string;
}

export default function DashboardPage() {
  const { session } = useAuthStore();
  const [kpis, setKpis] = useState<KpiCard[]>([]);
  const [recentOrders, setRecentOrders] = useState<SaleOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<AccountMove[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseOrder[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<StockPicking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    async function load() {
      try {
        const [orders, invoices, purchases, deliveries] = await Promise.all([
          odooCall<SaleOrder[]>("sale.order", "search_read", [[]], {
            fields: ["name", "partner_id", "date_order", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }),
          odooCall<AccountMove[]>("account.move", "search_read", [[["move_type", "=", "out_invoice"]]], {
            fields: ["name", "partner_id", "invoice_date", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }),
          odooCall<PurchaseOrder[]>("purchase.order", "search_read", [[]], {
            fields: ["name", "partner_id", "date_order", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }),
          odooCall<StockPicking[]>("stock.picking", "search_read", [[["picking_type_code", "=", "outgoing"]]], {
            fields: ["name", "partner_id", "scheduled_date", "state", "origin"],
            limit: 5,
            order: "id desc",
          }),
        ]);

        const draftOrders = orders.filter((o) => o.state === "draft");
        const confirmedOrders = orders.filter((o) => o.state === "sale");
        const unpaidInvoices = invoices.filter((i) => i.state === "posted");
        const draftPurchases = purchases.filter((p) => p.state === "draft");
        const pendingDeliveries = deliveries.filter((d) => d.state !== "done");

        setKpis([
          {
            label: "Draft Quotations",
            count: draftOrders.length,
            total: formatCurrency(draftOrders.reduce((s, o) => s + o.amount_total, 0)),
            href: "/quotations?state=draft",
            icon: FileText,
            color: "var(--color-primary)",
          },
          {
            label: "Confirmed Orders",
            count: confirmedOrders.length,
            total: formatCurrency(confirmedOrders.reduce((s, o) => s + o.amount_total, 0)),
            href: "/quotations?state=sale",
            icon: FileText,
            color: "#059669",
          },
          {
            label: "Unpaid Invoices",
            count: unpaidInvoices.length,
            total: formatCurrency(unpaidInvoices.reduce((s, i) => s + i.amount_total, 0)),
            href: "/invoices?state=posted",
            icon: Receipt,
            color: "var(--color-accent)",
          },
          {
            label: "Draft POs",
            count: draftPurchases.length,
            total: formatCurrency(draftPurchases.reduce((s, p) => s + p.amount_total, 0)),
            href: "/purchase-orders?state=draft",
            icon: ShoppingCart,
            color: "var(--color-info)",
          },
          {
            label: "Pending Deliveries",
            count: pendingDeliveries.length,
            total: "",
            href: "/delivery",
            icon: Truck,
            color: "var(--color-warning)",
          },
        ]);

        setRecentOrders(orders);
        setRecentInvoices(invoices);
        setRecentPurchases(purchases);
        setRecentDeliveries(deliveries);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                    {kpi.count}
                  </p>
                  {kpi.total && (
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {kpi.total}
                    </p>
                  )}
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
                >
                  <kpi.icon size={20} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              Recent Quotations
            </h2>
            <Link href="/quotations" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link key={order.id} href={`/quotations/${order.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-4 py-3 hover:bg-[var(--color-border-light)] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{order.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {order.partner_id[1]} &middot; {formatDate(order.date_order)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                      {formatCurrency(order.amount_total)}
                    </span>
                    <Badge state={order.state} />
                  </div>
                </div>
              </Link>
            ))}
            {recentOrders.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No quotations yet</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              Recent Invoices
            </h2>
            <Link href="/invoices" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-4 py-3 hover:bg-[var(--color-border-light)] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{inv.name || "Draft Invoice"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {inv.partner_id[1]} &middot; {formatDate(inv.invoice_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                      {formatCurrency(inv.amount_total)}
                    </span>
                    <Badge state={inv.state} />
                  </div>
                </div>
              </Link>
            ))}
            {recentInvoices.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No invoices yet</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              Recent Purchase Orders
            </h2>
            <Link href="/purchase-orders" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPurchases.map((po) => (
              <Link key={po.id} href={`/purchase-orders/${po.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-4 py-3 hover:bg-[var(--color-border-light)] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{po.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {po.partner_id[1]} &middot; {formatDate(po.date_order)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                      {formatCurrency(po.amount_total)}
                    </span>
                    <Badge state={po.state} />
                  </div>
                </div>
              </Link>
            ))}
            {recentPurchases.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No purchase orders yet</p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              Recent Deliveries
            </h2>
            <Link href="/delivery" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentDeliveries.map((d) => (
              <Link key={d.id} href={`/delivery/${d.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-light)] px-4 py-3 hover:bg-[var(--color-border-light)] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">{d.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {d.partner_id[1]}
                      {d.origin && <span className="ml-1">from {d.origin}</span>}
                    </p>
                  </div>
                  <Badge state={d.state} />
                </div>
              </Link>
            ))}
            {recentDeliveries.length === 0 && (
              <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No deliveries yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
