"use client";

import { useCallback } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchProducts } from "@/lib/odoo/partner";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { ProductProduct } from "@/types/odoo";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";

type ProductFilter = "all" | "sale" | "purchase" | "both";

export default function ProductsPage() {
  const router = useRouter();
  const { session } = useAuthStore();
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: ProductFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pagedProducts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === pagedProducts.length && pagedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagedProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const tabs = [
    { key: "all" as ProductFilter, label: "All", count: products.length },
    { key: "sale" as ProductFilter, label: "Sale", count: saleCount },
    { key: "purchase" as ProductFilter, label: "Purchase", count: purchaseCount },
    { key: "both" as ProductFilter, label: "Both", count: bothCount },
  ];

  return (
    <div className="w-full px-8 space-y-2">
      <div className="h-[64px] flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Products
        </h1>
        <Link href="/products/new">
          <Button size="md">
            <Plus size={16} />
            New Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-border-light)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={handleSearchChange}
          className="w-full h-[40px] rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] pl-12 pr-4 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:border-2 focus:outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-hairline)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-hairline)]">
                  <th className="px-4 py-1.5 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-[var(--color-hairline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                      checked={selectedIds.size === pagedProducts.length && pagedProducts.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-[35%]">Name</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Category</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {pagedProducts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/products/${p.id}`)}
                    className="hover:bg-[var(--color-surface-soft)] transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-[var(--color-hairline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="px-4 py-2 font-semibold text-[var(--color-ink)]">{p.default_code || "-"}</td>
                    <td className="px-4 py-2 text-[var(--color-ink)]">{p.name}</td>
                    <td className="px-4 py-2 text-[var(--color-muted)] text-sm">{p.categ_id?.[1] || "-"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                          p.sale_ok && p.purchase_ok
                            ? "bg-purple-50 text-purple-700"
                            : p.sale_ok
                            ? "bg-blue-50 text-blue-700"
                            : p.purchase_ok
                            ? "bg-orange-50 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        {p.sale_ok && p.purchase_ok
                          ? "Both"
                          : p.sale_ok
                          ? "Sale"
                          : p.purchase_ok
                          ? "Purchase"
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/products/${p.id}`}
                        className="font-bold text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        {formatCurrency(p.list_price)}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--color-surface-soft)] border-t border-[var(--color-hairline)]">
                <tr>
                  <td colSpan={5} className="px-4 py-1.5 text-right text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Total Products:
                  </td>
                  <td className="px-4 py-1.5 text-right font-bold text-[14px] text-[var(--color-ink)]">
                    {filtered.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">
              No products found
            </div>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--color-muted)]">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-[36px] rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
