"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchProducts } from "@/lib/odoo/partner";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { ProductProduct } from "@/types/odoo";
import { Search } from "lucide-react";

export default function ProductsPage() {
  const { session } = useAuthStore();
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session) loadProducts();
  }, [session]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.default_code && p.default_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Products
        </h1>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by name or SKU..."
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
          {filtered.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`}>
              <Card padding="none" className="hover:shadow-md transition-shadow mb-2">
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                      {p.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{p.default_code || ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                      {formatCurrency(p.list_price)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {p.sale_ok ? "Sale" : p.purchase_ok ? "Purchase" : ""}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">No products found</Card>
          )}
        </div>
      )}
    </div>
  );
}
