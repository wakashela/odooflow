"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProductById } from "@/lib/odoo/partner";
import { Card } from "@/components/ui/Card";
import type { ProductProduct } from "@/types/odoo";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<ProductProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const p = await fetchProductById(id);
      setProduct(p);
    } catch (err) {
      console.error("Failed to load product:", err);
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

  if (!product) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">Product not found</div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/products" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
            {product.name}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">{product.default_code || ""}</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="mb-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Details</h3>
            <p className="text-sm text-[var(--color-text)]">Category: {product.categ_id?.[1] || "-"}</p>
            <p className="text-sm text-[var(--color-text)]">UoM: {product.uom_id?.[1] || "-"}</p>
            <p className="text-sm text-[var(--color-text)]">Sale: {product.sale_ok ? "Yes" : "No"}</p>
            <p className="text-sm text-[var(--color-text)]">Purchase: {product.purchase_ok ? "Yes" : "No"}</p>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Pricing</h3>
            <p className="text-lg font-bold">{formatCurrency(product.list_price)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
