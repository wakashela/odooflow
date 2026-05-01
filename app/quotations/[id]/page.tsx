"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchQuotationById, fetchSaleOrderLines, confirmQuotation, updateSaleOrderLine, deleteSaleOrderLine, addSaleOrderLine } from "@/lib/odoo/sale";
import { createInvoicesFromSaleOrder } from "@/lib/odoo/invoice";
import { fetchProducts } from "@/lib/odoo/partner";
import { formatCurrency, formatDate, computeLineAmount } from "@/lib/utils";
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
import type { ProductProduct } from "@/types/odoo";
import { ArrowLeft, CheckCircle, Printer, FileText, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [rawLines, setRawLines] = useState<SaleOrderLine[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newProduct, setNewProduct] = useState(0);
  const [newQty, setNewQty] = useState(1);

  const isDraft = order?.state === "draft";
  const isConfirmed = order?.state === "sale";

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const [so, lines] = await Promise.all([
        fetchQuotationById(id),
        fetchSaleOrderLines(id),
      ]);
      setOrder(so);
      setRawLines(lines);
    } catch (err) {
      console.error("Failed to load quotation:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
    fetchProducts().then(setProducts);
  }, [loadOrder]);

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

  async function handleConfirm() {
    if (!confirm("Confirm this quotation? This will lock the line items.")) return;
    setConfirming(true);
    try {
      await confirmQuotation(id);
      await loadOrder();
    } catch (err) {
      alert(`Failed to confirm: ${(err as Error).message}`);
    } finally {
      setConfirming(false);
    }
  }

  async function handleCreateInvoice() {
    if (!confirm("Create invoice from this order?")) return;
    setCreatingInvoice(true);
    try {
      const invoiceIds = await createInvoicesFromSaleOrder(id);
      if (invoiceIds.length > 0) {
        router.push(`/invoices/${invoiceIds[0]}`);
      } else {
        alert("No invoice was created");
      }
    } catch (err) {
      alert(`Failed to create invoice: ${(err as Error).message}`);
    } finally {
      setCreatingInvoice(false);
    }
  }

  async function handleLineChange(lineId: number, field: keyof LineItem, value: number | string) {
    const line = rawLines.find((l) => l.id === lineId);
    if (!line) return;

    const update: Partial<SaleOrderLine> = {};
    if (field === "description") update.name = String(value);
    else if (field === "quantity") update.product_uom_qty = Number(value);
    else if (field === "unitPrice") update.price_unit = Number(value);
    else if (field === "discount") update.discount = Number(value);

    setRawLines(
      rawLines.map((l) => {
        if (l.id !== lineId) return l;
        const updated = { ...l, ...update };
        updated.price_subtotal = computeLineAmount(
          updated.product_uom_qty,
          updated.price_unit,
          updated.discount
        );
        return updated;
      })
    );

    try {
      await updateSaleOrderLine(lineId, update);
    } catch (err) {
      alert(`Failed to update line: ${(err as Error).message}`);
      await loadOrder();
    }
  }

  async function handleLineDelete(lineId: number) {
    if (!confirm("Delete this line item?")) return;
    try {
      await deleteSaleOrderLine(lineId);
      await loadOrder();
    } catch (err) {
      alert(`Failed to delete line: ${(err as Error).message}`);
    }
  }

  async function handleAddLine() {
    if (!newProduct) return;
    try {
      const product = products.find((p) => p.id === newProduct);
      if (!product) return;
      await addSaleOrderLine(id, {
        product_id: product.id,
        name: `${product.default_code ? product.default_code + " - " : ""}${product.name}`,
        product_uom_qty: newQty,
        price_unit: product.list_price,
      });
      setShowAddLine(false);
      setNewProduct(0);
      setNewQty(1);
      await loadOrder();
    } catch (err) {
      alert(`Failed to add line: ${(err as Error).message}`);
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
        Quotation not found
      </div>
    );
  }

  const computedSubtotal = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const computedTax = computedSubtotal * 0.18;
  const computedTotal = computedSubtotal + computedTax;

  const completedSteps: DocumentType[] = order.state === "sale" ? ["quotation"] : [];

  const hasInvoices = (order.invoice_ids?.length ?? 0) > 0;
  const hasPickings = (order.picking_ids?.length ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotations" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
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
          {isConfirmed && !hasInvoices && (
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              <FileText size={16} />
              {creatingInvoice ? "Creating..." : "Create Invoice"}
            </Button>
          )}
          <Link href={`/api/pdf/quotation/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Print PDF
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowBar currentType="quotation" completed={completedSteps} />

      {(isConfirmed || hasInvoices || hasPickings) && (
        <Card>
          <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Related Documents
          </h3>
          <div className="flex gap-3 flex-wrap">
            {isConfirmed && (
              <Link href={`/proforma/${id}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  Proforma PRO-{order.name}
                </span>
              </Link>
            )}
            {hasInvoices && order.invoice_ids!.map((invId) => (
              <Link key={invId} href={`/invoices/${invId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors">
                  <ExternalLink size={14} />
                  Invoice #{invId}
                </span>
              </Link>
            ))}
            {hasPickings && order.picking_ids!.map((pickId) => (
              <Link key={pickId} href={`/delivery/${pickId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                  <ExternalLink size={14} />
                  Delivery #{pickId}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <DocumentHeader
        documentName={order.name}
        documentType="Quotation"
        partnerName={order.partner_id[1]}
        date={order.date_order}
        expiryDate={order.validity_date}
      />

      <LineItemsTable
        lines={lineItems}
        editable={isDraft}
        onLineChange={handleLineChange}
        onLineDelete={handleLineDelete}
        onLineAdd={() => setShowAddLine(true)}
      />

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

      <Modal
        open={showAddLine}
        onClose={() => setShowAddLine(false)}
        title="Add Line Item"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Product</label>
            <select
              value={newProduct}
              onChange={(e) => setNewProduct(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value={0}>Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.default_code ? `${p.default_code} - ` : ""}{p.name} (TZS {p.list_price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Quantity"
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(Number(e.target.value))}
            min={1}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAddLine(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLine}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
