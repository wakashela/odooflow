"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchQuotationById, fetchSaleOrderLines } from "@/lib/odoo/sale";
import { fetchPurchaseOrdersByOrigin } from "@/lib/odoo/purchase";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DocumentHeader } from "@/components/documents/DocumentHeader";
import { LineItemsTable } from "@/components/documents/LineItemsTable";
import { TotalsBlock } from "@/components/documents/TotalsBlock";
import { BankDetails } from "@/components/documents/BankDetails";
import { WorkflowBar } from "@/components/layout/WorkflowBar";
import type { SaleOrder, SaleOrderLine } from "@/types/odoo";
import type { LineItem, DocumentType } from "@/types/documents";
import { ArrowLeft, Printer, ExternalLink } from "lucide-react";

export default function ProformaDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [rawLines, setRawLines] = useState<SaleOrderLine[]>([]);
  const [purchaseOrderIds, setPurchaseOrderIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [so, lines] = await Promise.all([
        fetchQuotationById(id),
        fetchSaleOrderLines(id),
      ]);
      const purchaseOrders = await fetchPurchaseOrdersByOrigin(so.name);
      setOrder(so);
      setRawLines(lines);
      setPurchaseOrderIds(purchaseOrders.map((po) => po.id));
    } catch (err) {
      console.error("Failed to load proforma:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        Order not found
      </div>
    );
  }

  const lineItems: LineItem[] = rawLines.map((l) => ({
    id: l.id,
    productId: l.product_id?.[0],
    productLabel: l.product_id?.[1],
    description: l.name,
    quantity: l.product_uom_qty,
    unitPrice: l.price_unit,
    discount: l.discount,
    subtotal: l.price_subtotal,
  }));

  const computedSubtotal = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const computedTax = computedSubtotal * 0.18;
  const computedTotal = computedSubtotal + computedTax;

  const hasInvoices = (order.invoice_ids?.length ?? 0) > 0;
  const hasPickings = (order.picking_ids?.length ?? 0) > 0;
  const hasPurchaseOrders = purchaseOrderIds.length > 0;
  const completedSteps: DocumentType[] = ["quotation",
    ...(hasPurchaseOrders ? ["purchase_order" as DocumentType] : []),
    ...(hasInvoices ? ["invoice" as DocumentType] : []),
    ...(hasPickings ? ["delivery" as DocumentType] : []),
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/proforma" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              PRO-{order.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge state="sale" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/api/pdf/proforma/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Print PDF
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowBar currentType="proforma" completed={completedSteps} />

      <Card>
        <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Related Documents
        </h3>
        <div className="flex gap-3 flex-wrap">
          <Link href={`/quotations/${id}`}>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
              <ExternalLink size={14} />
              Quotation {order.name}
            </span>
          </Link>
          {hasPurchaseOrders && purchaseOrderIds.map((poId) => (
            <Link key={poId} href={`/purchase-orders/${poId}`}>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors">
                <ExternalLink size={14} />
                Purchase Order #{poId}
              </span>
            </Link>
          ))}
          {hasInvoices && order.invoice_ids!.map((invId) => (
            <Link key={invId} href={`/invoices/${invId}`}>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors">
                <ExternalLink size={14} />
                Tax Invoice #{invId}
              </span>
            </Link>
          ))}
          {hasPickings && order.picking_ids!.map((pickId) => (
            <Link key={pickId} href={`/delivery/${pickId}`}>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                <ExternalLink size={14} />
                Delivery Note #{pickId}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <DocumentHeader
        documentName={`PRO-${order.name}`}
        documentType="Proforma Invoice"
        partnerName={order.partner_id[1]}
        date={order.date_order}
        expiryDate={order.validity_date}
      />

      <LineItemsTable lines={lineItems} />

      <TotalsBlock
        amountUntaxed={computedSubtotal}
        amountTax={computedTax}
        amountTotal={computedTotal}
      />

      {order.note && (
        <Card>
          <h3 className="mb-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Terms & Conditions
          </h3>
          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{order.note}</p>
        </Card>
      )}

      <BankDetails />
    </div>
  );
}
