"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getBackend } from "@/lib/data";
import { useAuthStore } from "@/store/authStore";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
import type { ResPartner } from "@/types/odoo";
import type { BankDetail, CompanySettings, PrintSettings } from "@/types/settings";
import { computeLineAmount } from "@/lib/utils";
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
import { ArrowLeft, CheckCircle, Printer, FileText, ExternalLink, ShoppingCart, Save } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/PageLoader";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { session } = useAuthStore();

  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [rawLines, setRawLines] = useState<SaleOrderLine[]>([]);
  const [purchaseOrderIds, setPurchaseOrderIds] = useState<number[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [creatingPurchaseOrder, setCreatingPurchaseOrder] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [newProduct, setNewProduct] = useState(0);
  const [newQty, setNewQty] = useState(1);
  const [partnerAddress, setPartnerAddress] = useState("");
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    enableOriginalDuplicate: false,
    showDeliveryTimeInLine: false,
    deliveryTimeUnit: "days",
  });

  const [showCustomerEditModal, setShowCustomerEditModal] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<ResPartner[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const isDraft = order?.state === "draft";
  const isConfirmed = order?.state === "sale";

  const loadOrder = useCallback(async () => {
    const backend = getBackend();
    try {
      setLoading(true);
      const [so, lines, company] = await Promise.all([
        backend.fetchQuotationById(id),
        backend.fetchSaleOrderLines(id),
        fetchCompanySettings(),
      ]);
      const [purchaseOrders, partner] = await Promise.all([
        backend.fetchPurchaseOrdersByOrigin(so.name),
        backend.fetchCustomerById(so.partner_id[0])
      ]);
      const [printSettingsData, bankData] = await Promise.all([
        fetchPrintSettings(),
        company ? fetchBankDetails(company.partner_id) : Promise.resolve([]),
      ]);
      setPrintSettings(printSettingsData);
      setBanks(bankData);
      setOrder(so);
      setRawLines(lines);
      setPurchaseOrderIds(purchaseOrders.map((po) => po.id));
      setBanks(bankData);
      setCompany(company);
      if (partner) {
        setPartnerAddress([partner.street, partner.city].filter(Boolean).join(", "));
      }
    } catch (err) {
      console.error("Failed to load quotation:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadOrder();
    const backend = getBackend();
    backend.fetchProducts().then(setProducts);
  }, [session, loadOrder]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!customerQuery.trim() || !showCustomerEditModal) {
        setCustomerSuggestions([]);
        return;
      }
      setCustomerSearching(true);
      try {
        const backend = getBackend();
        const results = await backend.searchPartners(customerQuery, 20);
        if (!active) return;
        setCustomerSuggestions(results);
      } catch (err) {
        console.error("Failed to search partners:", err);
      } finally {
        if (active) setCustomerSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery, showCustomerEditModal]);

  const lineItems: LineItem[] = rawLines.map((l) => {
    const label = l.product_id?.[1] || "";
    const match = label.match(/^\[(.*?)\]/);
    return {
      id: l.id,
      productId: l.product_id?.[0],
      productLabel: label,
      partNumber: match ? match[1] : "",
      description: l.name,
      quantity: l.product_uom_qty,
      unitPrice: l.price_unit,
      discount: l.discount,
      subtotal: l.price_subtotal,
      deliveryTime: l.x_delivery_time || "",
    };
  });

  async function handleSave() {
    setSaving(true);
    try {
      await loadOrder();
    } catch (err) {
      alert(`Failed to reload: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirm("Confirm this quotation?\n\nThis action will lock line items and move the workflow to proforma so purchase order processing can begin.")) return;
    setConfirming(true);
    try {
      const backend = getBackend();
      await backend.confirmQuotation(id);
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
      const backend = getBackend();
      const invoiceIds = await backend.createInvoicesFromSaleOrder(id);
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

  async function handleCreatePurchaseOrder() {
    if (!confirm("Create a purchase order from this confirmed order?")) return;
    setCreatingPurchaseOrder(true);
    try {
      const backend = getBackend();
      const purchaseOrderId = await backend.createPurchaseOrderFromSaleOrder(id);
      await loadOrder();
      router.push(`/purchase-orders/${purchaseOrderId}`);
    } catch (err) {
      alert(`Failed to create purchase order: ${(err as Error).message}`);
    } finally {
      setCreatingPurchaseOrder(false);
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
    else if (field === "deliveryTime") update.x_delivery_time = String(value);

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
      const backend = getBackend();
      await backend.updateSaleOrderLine(lineId, update);
    } catch (err) {
      alert(`Failed to update line: ${(err as Error).message}`);
      await loadOrder();
    }
  }

  async function handleLineDelete(lineId: number) {
    if (!confirm("Delete this line item?")) return;
    try {
      const backend = getBackend();
      await backend.deleteSaleOrderLine(lineId);
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
      const backend = getBackend();
      await backend.addSaleOrderLine(id, {
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
    return <PageLoader message="Loading quotation…" />;
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

  const hasInvoices = (order.invoice_ids?.length ?? 0) > 0;
  const hasPickings = (order.picking_ids?.length ?? 0) > 0;
  const hasPurchaseOrders = purchaseOrderIds.length > 0;
  const completedSteps: DocumentType[] = !isConfirmed
    ? []
    : ["quotation", "proforma",
      ...(hasPurchaseOrders ? ["purchase_order" as DocumentType] : []),
      ...(hasInvoices ? ["invoice" as DocumentType] : []),
      ...(hasPickings ? ["delivery" as DocumentType] : []),
    ];

  return (
    <div className="w-full py-12 px-10 space-y-6">
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
            <>
              <Button onClick={handleSave} disabled={saving} variant="outline">
                <Save size={16} />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={handleConfirm} disabled={confirming}>
                <CheckCircle size={16} />
                {confirming ? "Confirming..." : "Confirm Order"}
              </Button>
            </>
          )}
          {isConfirmed && !hasPurchaseOrders && (
            <Button onClick={handleCreatePurchaseOrder} disabled={creatingPurchaseOrder}>
              <ShoppingCart size={16} />
              {creatingPurchaseOrder ? "Creating..." : "Create Purchase Order"}
            </Button>
          )}
          {isConfirmed && hasPurchaseOrders && !hasInvoices && (
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              <FileText size={16} />
              {creatingInvoice ? "Creating..." : "Create Tax Invoice"}
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

      {(isConfirmed || hasInvoices || hasPickings || hasPurchaseOrders) && (
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
      )}

      <DocumentHeader
        documentName={order.name}
        documentType="Quotation"
        partnerName={order.partner_id[1]}
        partnerAddress={partnerAddress}
        date={order.date_order}
        expiryDate={order.validity_date}
        company={company}
        onEditCustomer={isDraft ? () => setShowCustomerEditModal(true) : undefined}
      />

      <LineItemsTable
        lines={lineItems}
        editable={isDraft}
        showDeliveryTime={printSettings.showDeliveryTimeInLine}
        deliveryTimeUnit={printSettings.deliveryTimeUnit}
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
          <h3 className="mb-2 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">
            Terms & Conditions
          </h3>
          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{order.note?.replace(/<\/?p[^>]*>/gi, '').trim()}</p>
        </Card>
      )}

      <BankDetails banks={banks} />

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

      <Modal open={showCustomerEditModal} onClose={() => setShowCustomerEditModal(false)} title="Change Customer">
        <div className="flex flex-col gap-1.5 relative pb-40">
          <Input
            label="Search Customer"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="Type customer name..."
            autoFocus
          />
          {customerQuery && customerSuggestions.length > 0 && (
            <div className="absolute top-16 z-50 w-full max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-white shadow-lg">
              {customerSuggestions.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    try {
                      const backend = getBackend();
                      await backend.updateQuotation(id, { partner_id: c.id as unknown as [number, string] });
                      setShowCustomerEditModal(false);
                      setCustomerQuery("");
                      await loadOrder();
                    } catch (err) {
                      alert(`Failed to update customer: ${(err as Error).message}`);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-border-light)]"
                >
                  <div className="font-medium text-[var(--color-text)]">{c.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{c.email || c.phone || c.city}</div>
                </button>
              ))}
            </div>
          )}
          {customerQuery && customerSuggestions.length === 0 && !customerSearching && (
            <div className="text-sm text-[var(--color-text-muted)] mt-2">
              No matching customers found.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
