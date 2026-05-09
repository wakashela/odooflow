"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchPurchaseOrderById, fetchPurchaseOrderLines, confirmPurchaseOrder } from "@/lib/odoo/purchase";
import { odooCall } from "@/lib/odoo/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fetchCustomerById } from "@/lib/odoo/partner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DocumentHeader } from "@/components/documents/DocumentHeader";
import { LineItemsTable } from "@/components/documents/LineItemsTable";
import { TotalsBlock } from "@/components/documents/TotalsBlock";
import { BankDetails } from "@/components/documents/BankDetails";
import { WorkflowBar } from "@/components/layout/WorkflowBar";
import type { PurchaseOrder, PurchaseOrderLine, SaleOrder } from "@/types/odoo";
import type { LineItem, DocumentType } from "@/types/documents";
import { ArrowLeft, CheckCircle, Printer, ExternalLink } from "lucide-react";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [rawLines, setRawLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [originSoId, setOriginSoId] = useState<number | null>(null);
  const [partnerAddress, setPartnerAddress] = useState("");

  const isDraft = order?.state === "draft";

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [po, lines] = await Promise.all([
        fetchPurchaseOrderById(id),
        fetchPurchaseOrderLines(id),
      ]);
      setOrder(po);
      setRawLines(lines);

      const partner = await fetchCustomerById(po.partner_id[0]);
      if (partner) {
        setPartnerAddress([partner.street, partner.city].filter(Boolean).join(", "));
      }

      if (po.origin) {
        try {
          const sos = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["name", "=", po.origin]]], {
            fields: ["id"],
            limit: 1,
          });
          if (sos.length) setOriginSoId(sos[0].id);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load purchase order:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  async function handleConfirm() {
    if (!confirm("Confirm this purchase order?")) return;
    setConfirming(true);
    try {
      await confirmPurchaseOrder(id);
      await loadOrder();
    } catch (err) {
      alert(`Failed to confirm: ${(err as Error).message}`);
    } finally {
      setConfirming(false);
    }
  }

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
        Purchase order not found
      </div>
    );
  }

  const lineItems: LineItem[] = rawLines.map((l) => {
    const label = l.product_id?.[1] || "";
    const match = label.match(/^\\[(.*?)\\]/);
    return {
      id: l.id,
      productId: l.product_id?.[0],
      productLabel: label,
      partNumber: match ? match[1] : "",
      description: l.name,
      quantity: l.product_qty,
      unitPrice: l.price_unit,
      discount: 0,
      subtotal: l.price_subtotal,
    };
  });

  const completedSteps: DocumentType[] = ["quotation", "proforma"];

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              {order.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge state={order.state} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handleConfirm} disabled={confirming}>
              <CheckCircle size={16} />
              {confirming ? "Confirming..." : "Confirm Order"}
            </Button>
          )}
          <Link href={`/api/pdf/purchase-order/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Print PDF
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowBar currentType="purchase_order" completed={completedSteps} />

      {(order.origin || originSoId) && (
        <Card>
          <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Related Documents
          </h3>
          <div className="flex gap-3 flex-wrap">
            {originSoId && (
              <Link href={`/quotations/${originSoId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  Sale Order {order.origin}
                </span>
              </Link>
            )}
          </div>
        </Card>
      )}

      <DocumentHeader
        documentName={order.name}
        documentType="Purchase Order"
        partnerName={order.partner_id[1]}
        partnerAddress={partnerAddress}
        date={order.date_order}
        expiryDate={order.date_planned}
        origin={order.origin}
      />

      <LineItemsTable lines={lineItems} />

      <TotalsBlock
        amountUntaxed={order.amount_untaxed}
        amountTax={order.amount_tax}
        amountTotal={order.amount_total}
      />

      {order.notes && (
        <Card>
          <h3 className="mb-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Notes
          </h3>
          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{order.notes?.replace(new RegExp('<\\\\/?p[^>]*>', 'g'), '')}</p>
        </Card>
      )}

      <BankDetails />
    </div>
  );
}
