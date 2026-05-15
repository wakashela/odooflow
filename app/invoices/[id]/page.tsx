"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchInvoiceById, fetchInvoiceLines, postInvoice } from "@/lib/odoo/invoice";
import { odooCall } from "@/lib/odoo/client";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import { fetchCustomerById } from "@/lib/odoo/partner";
import { fetchCompanySettings, fetchBankDetails, fetchPrintSettings } from "@/lib/odoo/settings";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DocumentHeader } from "@/components/documents/DocumentHeader";
import { LineItemsTable } from "@/components/documents/LineItemsTable";
import { TotalsBlock } from "@/components/documents/TotalsBlock";
import { BankDetails } from "@/components/documents/BankDetails";
import { WorkflowBar } from "@/components/layout/WorkflowBar";
import type { AccountMove, AccountMoveLine, SaleOrder } from "@/types/odoo";
import type { LineItem, DocumentType } from "@/types/documents";
import type { BankDetail, CompanySettings, PrintSettings } from "@/types/settings";
import { ArrowLeft, CheckCircle, Printer, ExternalLink } from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { session } = useAuthStore();

  const [invoice, setInvoice] = useState<AccountMove | null>(null);
  const [rawLines, setRawLines] = useState<AccountMoveLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [originSoId, setOriginSoId] = useState<number | null>(null);
  const [partnerAddress, setPartnerAddress] = useState("");
  const [banks, setBanks] = useState<BankDetail[]>([]);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    enableOriginalDuplicate: false,
    showDeliveryTimeInLine: false,
    deliveryTimeUnit: "days",
  });

  const isDraft = invoice?.state === "draft";

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const [inv, lines, company] = await Promise.all([
        fetchInvoiceById(id),
        fetchInvoiceLines(id),
        fetchCompanySettings(),
      ]);
      setInvoice(inv);
      setRawLines(lines);

      const partner = await fetchCustomerById(inv.partner_id[0]);
      if (partner) {
        setPartnerAddress([partner.street, partner.city].filter(Boolean).join(", "));
      }

      const [printSettingsData, bankData] = await Promise.all([
        fetchPrintSettings(),
        company ? fetchBankDetails(company.partner_id) : Promise.resolve([]),
      ]);
      setPrintSettings(printSettingsData);
      setBanks(bankData);
      setCompany(company);

      if (inv.invoice_origin) {
        try {
          const sos = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["name", "=", inv.invoice_origin]]], {
            fields: ["id"],
            limit: 1,
          });
          if (sos.length) setOriginSoId(sos[0].id);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load invoice:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadInvoice();
  }, [session, loadInvoice]);

  async function handlePost() {
    if (!confirm("Post this invoice? This will lock it.")) return;
    setPosting(true);
    try {
      await postInvoice(id);
      await loadInvoice();
    } catch (err) {
      alert(`Failed to post: ${(err as Error).message}`);
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        Invoice not found
      </div>
    );
  }

  const lineItems: LineItem[] = rawLines.map((l) => {
    const label = l.product_id?.[1] || "";
    const match = label.match(/^\[(.*?)\]/);
    return {
      id: l.id,
      productId: l.product_id?.[0],
      productLabel: label,
      partNumber: match ? match[1] : "",
      description: l.name,
      quantity: l.quantity,
      unitPrice: l.price_unit,
      discount: l.discount,
      subtotal: l.price_subtotal,
      deliveryTime: l.x_delivery_time || "",
    };
  });

  const completedSteps: DocumentType[] = ["quotation", "proforma"];

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              {invoice.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge state={invoice.state} />
              {invoice.payment_state && (
                <Badge state={invoice.payment_state} />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button onClick={handlePost} disabled={posting}>
              <CheckCircle size={16} />
              {posting ? "Posting..." : "Post Invoice"}
            </Button>
          )}
          <Link href={`/api/pdf/invoice/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Print PDF
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowBar currentType="invoice" completed={completedSteps} />

      {(invoice.invoice_origin || originSoId) && (
        <Card>
          <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Related Documents
          </h3>
          <div className="flex gap-3 flex-wrap">
            {originSoId && (
              <Link href={`/quotations/${originSoId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  {invoice.invoice_origin}
                </span>
              </Link>
            )}
            {originSoId && (
              <Link href={`/proforma/${originSoId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  Proforma PRO-{invoice.invoice_origin}
                </span>
              </Link>
            )}
          </div>
        </Card>
      )}

      <DocumentHeader
        documentName={invoice.name}
        documentType="Tax Invoice"
        partnerName={invoice.partner_id[1]}
        partnerAddress={partnerAddress}
        date={invoice.invoice_date}
        expiryDate={invoice.invoice_date_due}
        origin={invoice.invoice_origin}
        company={company}
      />

      <LineItemsTable lines={lineItems} showDeliveryTime={printSettings.showDeliveryTimeInLine} deliveryTimeUnit={printSettings.deliveryTimeUnit} />

      <TotalsBlock
        amountUntaxed={invoice.amount_untaxed}
        amountTax={invoice.amount_tax}
        amountTotal={invoice.amount_total}
      />

      {invoice.narration && (
        <Card>
          <h3 className="mb-2 text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">
            Notes
          </h3>
          <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap">{invoice.narration?.replace(/<\/?p[^>]*>/gi, '').trim()}</p>
        </Card>
      )}

      <BankDetails banks={banks} />
    </div>
  );
}
