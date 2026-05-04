"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchCustomers } from "@/lib/odoo/partner";
import { Card } from "@/components/ui/Card";
import type { ResPartner } from "@/types/odoo";
import { Search } from "lucide-react";

export default function CustomersPage() {
  const { session } = useAuthStore();
  const [customers, setCustomers] = useState<ResPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session) loadCustomers();
  }, [session]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Customers
        </h1>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card padding="none" className="hover:shadow-md transition-shadow mb-2">
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                      {c.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{c.city || ""} {c.phone ? `· ${c.phone}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-muted)]">{c.email || ""}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">No customers found</Card>
          )}
        </div>
      )}
    </div>
  );
}
