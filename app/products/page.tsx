"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchProducts, updateProduct, createProduct } from "@/lib/odoo/partner";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ProductProduct } from "@/types/odoo";
import { Search, Plus, Edit2, Check, X } from "lucide-react";

export default function ProductsPage() {
  const { session } = useAuthStore();
  const router = useRouter();
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editSaleOk, setEditSaleOk] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

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

  function startEdit(p: ProductProduct) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditCode(p.default_code || "");
    setEditPrice(p.list_price);
    setEditSaleOk(p.sale_ok);
  }

  async function saveEdit() {
    if (editingId === null || !editName.trim()) return;
    setSavingId(editingId);
    try {
      await updateProduct(editingId, {
        name: editName.trim(),
        default_code: editCode.trim() || undefined,
        list_price: editPrice,
        sale_ok: editSaleOk,
      });
      await loadProducts();
      setEditingId(null);
    } catch (err) {
      alert(`Failed to update product: ${(err as Error).message}`);
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleCreateQuick() {
    try {
      const name = `New Product ${Date.now()}`;
      const id = await createProduct({
        name,
        default_code: `TMP-${Date.now()}`,
        list_price: 0,
        sale_ok: true,
        purchase_ok: false,
      });
      router.push(`/products/${id}`);
    } catch (err) {
      alert(`Failed to create product: ${(err as Error).message}`);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateQuick}>
            <Plus size={14} />
            Quick Create
          </Button>
          <Link href="/products/new">
            <Button>New Product</Button>
          </Link>
        </div>
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
            <div key={p.id} className="hover:shadow-md transition-shadow mb-2">
              <Card padding="none" className="hover:shadow-md transition-shadow">
                {editingId === p.id ? (
                  <div className="flex items-center gap-3 px-6 py-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Product name"
                      />
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        placeholder="SKU / Code"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={editPrice || ""}
                        onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                        placeholder="Rate"
                        className="w-28"
                      />
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={editSaleOk}
                          onChange={(e) => setEditSaleOk(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        Sale
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          disabled={savingId === p.id}
                          className="p-1.5 rounded text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded text-[var(--color-text-light)] hover:bg-[var(--color-border-light)]"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href={`/products/${p.id}`} className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                        {p.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{p.default_code || "-"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-base font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                          {formatCurrency(p.list_price)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {p.sale_ok ? "Sale" : p.purchase_ok ? "Purchase" : ""}
                        </p>
                      </div>
                       <button
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           startEdit(p);
                         }}
                         className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-light)] transition-colors"
                         title="Edit"
                       >
                         <Edit2 size={14} />
                       </button>
                    </div>
                  </Link>
                )}
              </Card>
            </div>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">No products found</Card>
          )}
        </div>
      )}
    </div>
  );
}
