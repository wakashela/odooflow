"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCustomerById } from "@/lib/odoo/partner";
import { Card } from "@/components/ui/Card";
import type { ResPartner } from "@/types/odoo";
import { ArrowLeft } from "lucide-react";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [customer, setCustomer] = useState<ResPartner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const p = await fetchCustomerById(id);
      setCustomer(p);
    } catch (err) {
      console.error("Failed to load customer:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return <div className="py-12 text-center text-[var(--color-text-muted)]">Customer not found</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
            {customer.name}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">{customer.vat || ""}</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Contact</h3>
            <p className="text-sm text-[var(--color-text)]">Email: {customer.email || "-"}</p>
            <p className="text-sm text-[var(--color-text)]">Phone: {customer.phone || "-"}</p>
            <p className="text-sm text-[var(--color-text)]">Address: {customer.street || "-"}</p>
            <p className="text-sm text-[var(--color-text)]">City: {customer.city || "-"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
