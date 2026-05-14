"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchDeliveryById, fetchStockMoves, validateDelivery } from "@/lib/odoo/stock";
import { odooCall } from "@/lib/odoo/client";
import { useAuthStore } from "@/store/authStore";
import { formatDateTime } from "@/lib/utils";
import { fetchCustomerById } from "@/lib/odoo/partner";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkflowBar } from "@/components/layout/WorkflowBar";
import type { StockPicking, StockMove, SaleOrder, ResPartner } from "@/types/odoo";
import type { DocumentType } from "@/types/documents";
import { ArrowLeft, CheckCircle, Printer, ExternalLink } from "lucide-react";

export default function DeliveryDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { session } = useAuthStore();

  const [picking, setPicking] = useState<StockPicking | null>(null);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [originSoId, setOriginSoId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<ResPartner | null>(null);

  const canValidate =
    picking?.state === "assigned" ||
    picking?.state === "confirmed";

  const loadPicking = useCallback(async () => {
    try {
      setLoading(true);
      const [p, m] = await Promise.all([
        fetchDeliveryById(id),
        fetchStockMoves(id),
      ]);
      setPicking(p);
      setMoves(m);

      // Fetch customer details
      if (p.partner_id?.[0]) {
        try {
          const customerData = await fetchCustomerById(p.partner_id[0]);
          setCustomer(customerData);
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
      }

      if (p.origin) {
        try {
          const sos = await odooCall<SaleOrder[]>("sale.order", "search_read", [[["name", "=", p.origin]]], {
            fields: ["id"],
            limit: 1,
          });
          if (sos.length) setOriginSoId(sos[0].id);
        } catch {}
      }
    } catch (err) {
      console.error("Failed to load delivery:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadPicking();
  }, [session, loadPicking]);

  async function handleValidate() {
    if (!confirm("Validate this delivery? This will mark it as done.")) return;
    setValidating(true);
    try {
      await validateDelivery(id);
      await loadPicking();
    } catch (err) {
      alert(`Failed to validate: ${(err as Error).message}`);
    } finally {
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (!picking) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        Delivery not found
      </div>
    );
  }

  const completedSteps: DocumentType[] = [
    "quotation", "proforma", "purchase_order", "invoice",
    ...(picking.state === "done" ? ["packing_list" as DocumentType] : []),
  ];

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/delivery" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              {picking.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge state={picking.state} />
              {picking.origin && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  from {picking.origin}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canValidate && (
            <Button onClick={handleValidate} disabled={validating}>
              <CheckCircle size={16} />
              {validating ? "Validating..." : "Validate"}
            </Button>
          )}
          <Link href={`/api/pdf/delivery/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Delivery Note
            </Button>
          </Link>
          <Link href={`/api/pdf/packing-list/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Packing List
            </Button>
          </Link>
        </div>
      </div>

      <WorkflowBar currentType="delivery" completed={completedSteps} />

      {(picking.origin || originSoId) && (
        <Card>
          <h3 className="mb-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Related Documents
          </h3>
          <div className="flex gap-3 flex-wrap">
            {originSoId && (
              <Link href={`/quotations/${originSoId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  Order {picking.origin}
                </span>
              </Link>
            )}
            {originSoId && (
              <Link href={`/proforma/${originSoId}`}>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                  <ExternalLink size={14} />
                  Proforma PRO-{picking.origin}
                </span>
              </Link>
            )}
            <Link href={`/api/pdf/packing-list/${id}`} target="_blank">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors">
                <Printer size={14} />
                Packing List PDF
              </span>
            </Link>
          </div>
        </Card>
      )}

      <Card>
        <div className="grid grid-cols-2 gap-6 p-6">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Customer Details
            </p>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--color-text)]">{picking.partner_id[1]}</p>
              {customer && (
                <div className="text-sm text-[var(--color-text-muted)]">
                  {customer.street && <div>{customer.street}</div>}
                  {(customer.street2 || customer.city || (customer.state_id && customer.state_id[1]) || customer.zip) && (
                    <div>
                      {[customer.street2, customer.city, customer.state_id && customer.state_id[1], customer.zip].filter(Boolean).join(", ")}
                    </div>
                  )}
                  {customer.country_id && customer.country_id[1] && <div>{customer.country_id[1]}</div>}
                  {customer.phone && <div>Phone: {customer.phone}</div>}
                  {customer.email && <div>Email: {customer.email}</div>}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">Scheduled: </span>
              <span className="text-sm font-medium text-[var(--color-text)]">
                {formatDateTime(picking.scheduled_date)}
              </span>
            </div>
            {picking.date_done && (
              <div>
                <span className="text-xs text-[var(--color-text-muted)]">Completed: </span>
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {formatDateTime(picking.date_done)}
                </span>
              </div>
            )}
            {picking.picking_type_id && (
              <div>
                <span className="text-xs text-[var(--color-text-muted)]">Type: </span>
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {picking.picking_type_id[1]}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-primary)] text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-8">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-32">
                Part No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider">
                Product
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">
                Demand
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">
                Done
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">
                UoM
              </th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move, idx) => (
              <tr
                key={move.id}
                className={`border-b border-[var(--color-border-light)] ${idx % 2 === 1 ? "bg-[var(--color-row-alt)]" : ""}`}
              >
                <td className="px-4 py-3 text-[var(--color-text-muted)]">{idx + 1}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs font-medium">
                  {(() => {
                    const label = move.product_id?.[1] || "";
                    const match = label.match(/^\[(.*?)\]/);
                    return match ? match[1] : "-";
                  })()}
                </td>
                <td className="px-4 py-3 text-[var(--color-text)]">
                  {move.product_id?.[1] || move.name}
                </td>
                <td className="px-4 py-3 text-right font-medium">{move.product_uom_qty}</td>
                <td className="px-4 py-3 text-right font-medium">{move.quantity_done}</td>
                <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">
                  {move.product_uom?.[1] || "-"}
                </td>
              </tr>
            ))}
            {moves.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No stock moves
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
