"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBackend } from "@/lib/data";
import { useAuthStore } from "@/store/authStore";
import { formatDateTime } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { StockPicking, StockMove, ResPartner } from "@/types/odoo";
import { ArrowLeft, Printer } from "lucide-react";

export default function PackingListDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { session } = useAuthStore();

  const [picking, setPicking] = useState<StockPicking | null>(null);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<ResPartner | null>(null);

  const loadPacking = useCallback(async () => {
    const backend = getBackend();
    try {
      setLoading(true);
      const [p, m] = await Promise.all([
        backend.fetchDeliveryById(id),
        backend.fetchStockMoves(id),
      ]);
      setPicking(p);
      setMoves(m);

      if (p.partner_id?.[0]) {
        try {
          const customerData = await backend.fetchCustomerById(p.partner_id[0]);
          setCustomer(customerData);
        } catch (err) {
          console.error("Failed to fetch customer:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load packing list:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadPacking();
  }, [session, loadPacking]);

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
        Packing list not found
      </div>
    );
  }

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/delivery/${id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              PL-{picking.name}
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
          <Link href={`/api/pdf/packing-list/${id}`} target="_blank">
            <Button variant="outline">
              <Printer size={16} />
              Print PDF
            </Button>
          </Link>
        </div>
      </div>

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
                  {[customer.street2, customer.city, customer.state_id && customer.state_id[1], customer.zip].filter(Boolean).join(", ") && (
                    <div>{[customer.street2, customer.city, customer.state_id && customer.state_id[1], customer.zip].filter(Boolean).join(", ")}</div>
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
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-primary)] text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-8">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider">Product</th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">Ordered</th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">Shipped</th>
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">UoM</th>
            </tr>
          </thead>
          <tbody>
            {moves.map((move, idx) => (
              <tr
                key={move.id}
                className={`border-b border-[var(--color-border-light)] ${idx % 2 === 1 ? "bg-[var(--color-row-alt)]" : ""}`}
              >
                <td className="px-4 py-3 text-[var(--color-text-muted)]">{idx + 1}</td>
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
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}