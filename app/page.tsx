"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Badge } from "@/components/ui/Badge";
import { getBackend } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaleOrder, AccountMove, PurchaseOrder, StockPicking } from "@/types/odoo";
import { FileText, Receipt, ShoppingCart, Truck, ArrowRight, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PageLoader } from "@/components/ui/PageLoader";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface KpiData {
  label: string;
  count: number;
  total: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

export default function DashboardPage() {
  const { session } = useAuthStore();
  const [kpis, setKpis] = useState<KpiData[]>([]);
  const [recentOrders, setRecentOrders] = useState<SaleOrder[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<AccountMove[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<PurchaseOrder[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<StockPicking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    async function load() {
      const backend = getBackend();
      try {
        const [orders, invoices, purchases, deliveries] = await Promise.all([
          backend.call("sale.order", "search_read", [[]], {
            fields: ["name", "partner_id", "date_order", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }) as Promise<SaleOrder[]>,
          backend.call("account.move", "search_read", [[["move_type", "=", "out_invoice"]]], {
            fields: ["name", "partner_id", "invoice_date", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }) as Promise<AccountMove[]>,
          backend.call("purchase.order", "search_read", [[]], {
            fields: ["name", "partner_id", "date_order", "amount_total", "state"],
            limit: 5,
            order: "id desc",
          }) as Promise<PurchaseOrder[]>,
          backend.call("stock.picking", "search_read", [[["picking_type_code", "=", "outgoing"]]], {
            fields: ["name", "partner_id", "scheduled_date", "state", "origin"],
            limit: 5,
            order: "id desc",
          }) as Promise<StockPicking[]>,
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
            gradient: "linear-gradient(135deg, #ff385c 0%, #e00b41 100%)",
            iconBg: "rgba(255, 56, 92, 0.1)",
          },
          {
            label: "Confirmed Orders",
            count: confirmedOrders.length,
            total: formatCurrency(confirmedOrders.reduce((s, o) => s + o.amount_total, 0)),
            href: "/quotations?state=sale",
            icon: TrendingUp,
            gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            iconBg: "rgba(5, 150, 105, 0.1)",
          },
          {
            label: "Unpaid Invoices",
            count: unpaidInvoices.length,
            total: formatCurrency(unpaidInvoices.reduce((s, i) => s + i.amount_total, 0)),
            href: "/invoices?state=posted",
            icon: Receipt,
            gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            iconBg: "rgba(245, 158, 11, 0.1)",
          },
          {
            label: "Draft POs",
            count: draftPurchases.length,
            total: formatCurrency(draftPurchases.reduce((s, p) => s + p.amount_total, 0)),
            href: "/purchase-orders?state=draft",
            icon: ShoppingCart,
            gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            iconBg: "rgba(99, 102, 241, 0.1)",
          },
          {
            label: "Pending Deliveries",
            count: pendingDeliveries.length,
            total: "",
            href: "/delivery",
            icon: Truck,
            gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            iconBg: "rgba(14, 165, 233, 0.1)",
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
  }, [session]);

  if (loading) {
    return <PageLoader message="Loading dashboard…" />;
  }

  const firstName = session?.name?.split(" ")[0] || "there";

  return (
    <div className="w-full py-10 px-10 space-y-8">
      {/* ── Header ── */}
      <div
        className="dash-fade-in"
        style={{ animationDelay: "0ms" }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--color-muted)]">
          Here&apos;s what&apos;s happening across your business today.
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, i) => (
          <Link key={kpi.label} href={kpi.href}>
            <div
              className="dash-fade-in group relative overflow-hidden rounded-2xl border border-[var(--color-hairline-soft)] bg-white p-5 transition-all duration-300 hover:shadow-airbnb hover:-translate-y-0.5 cursor-pointer"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              {/* Gradient accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
                style={{ background: kpi.gradient }}
              />

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    {kpi.label}
                  </p>
                  <p className="mt-3 text-[32px] font-bold leading-none tracking-tight text-[var(--color-ink)]">
                    {kpi.count}
                  </p>
                  {kpi.total && (
                    <p className="mt-1.5 text-[13px] text-[var(--color-muted-soft)]">
                      {kpi.total}
                    </p>
                  )}
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: kpi.iconBg }}
                >
                  <kpi.icon size={20} style={{ color: kpi.iconBg.replace("0.1)", "1)") }} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div
        className="dash-fade-in flex flex-wrap items-center gap-3"
        style={{ animationDelay: "400ms" }}
      >
        <span className="text-[13px] font-medium text-[var(--color-muted)]">Quick actions</span>
        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-sm"
        >
          <Plus size={14} /> New Quotation
        </Link>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-sm"
        >
          <Plus size={14} /> New Customer
        </Link>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-white px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-sm"
        >
          <Plus size={14} /> New Product
        </Link>
      </div>

      {/* ── Activity Feed Grid ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Quotations */}
        <div
          className="dash-fade-in"
          style={{ animationDelay: "460ms" }}
        >
          <RecentSection
            title="Recent Quotations"
            viewAllHref="/quotations"
            emptyMessage="No quotations yet"
            items={recentOrders.map((order) => ({
              id: order.id,
              href: `/quotations/${order.id}`,
              title: order.name,
              subtitle: `${order.partner_id[1]} · ${formatDate(order.date_order)}`,
              amount: formatCurrency(order.amount_total),
              state: order.state,
            }))}
          />
        </div>

        {/* Recent Invoices */}
        <div
          className="dash-fade-in"
          style={{ animationDelay: "520ms" }}
        >
          <RecentSection
            title="Recent Invoices"
            viewAllHref="/invoices"
            emptyMessage="No invoices yet"
            items={recentInvoices.map((inv) => ({
              id: inv.id,
              href: `/invoices/${inv.id}`,
              title: inv.name || "Draft Invoice",
              subtitle: `${inv.partner_id[1]} · ${formatDate(inv.invoice_date)}`,
              amount: formatCurrency(inv.amount_total),
              state: inv.state,
            }))}
          />
        </div>

        {/* Recent Purchase Orders */}
        <div
          className="dash-fade-in"
          style={{ animationDelay: "580ms" }}
        >
          <RecentSection
            title="Recent Purchase Orders"
            viewAllHref="/purchase-orders"
            emptyMessage="No purchase orders yet"
            items={recentPurchases.map((po) => ({
              id: po.id,
              href: `/purchase-orders/${po.id}`,
              title: po.name,
              subtitle: `${po.partner_id[1]} · ${formatDate(po.date_order)}`,
              amount: formatCurrency(po.amount_total),
              state: po.state,
            }))}
          />
        </div>

        {/* Recent Deliveries */}
        <div
          className="dash-fade-in"
          style={{ animationDelay: "640ms" }}
        >
          <RecentSection
            title="Recent Deliveries"
            viewAllHref="/delivery"
            emptyMessage="No deliveries yet"
            items={recentDeliveries.map((d) => ({
              id: d.id,
              href: `/delivery/${d.id}`,
              title: d.name,
              subtitle: d.origin ? `${d.partner_id[1]} · from ${d.origin}` : d.partner_id[1],
              state: d.state,
            }))}
          />
        </div>
      </div>

      {/* ── Animation Styles ── */}
      <style jsx>{`
        @keyframes dashFadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dash-fade-in {
          opacity: 0;
          animation: dashFadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

/* ── Reusable Recent Section ── */

interface RecentItem {
  id: number;
  href: string;
  title: string;
  subtitle: string;
  amount?: string;
  state: string;
}

function RecentSection({
  title,
  viewAllHref,
  emptyMessage,
  items,
}: {
  title: string;
  viewAllHref: string;
  emptyMessage: string;
  items: RecentItem[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-hairline-soft)] bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline-soft)]">
        <h2 className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</h2>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {/* Items */}
      <div className="divide-y divide-[var(--color-hairline-soft)]">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <div className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--color-surface-soft)] group">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[var(--color-ink)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                  {item.title}
                </p>
                <p className="text-[12px] text-[var(--color-muted-soft)] mt-0.5 truncate">
                  {item.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {item.amount && (
                  <span className="text-[13px] font-semibold text-[var(--color-ink)] tabular-nums">
                    {item.amount}
                  </span>
                )}
                <Badge state={item.state} />
              </div>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[var(--color-muted-soft)]">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
