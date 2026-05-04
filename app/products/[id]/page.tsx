"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProductById, updateProduct } from "@/lib/odoo/partner";
import { type ProductProduct } from "@/types/odoo";
import { ArrowLeft, Edit2, Tag, Layers, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function InfoRow({ icon: Icon, label, value, editable, onChange, animateIn, compact }: { icon: any; label: string; value: string | boolean | number; editable?: boolean; onChange?: (v: string | boolean | number) => void; animateIn?: boolean; compact?: boolean }) {
  const isBoolean = typeof value === "boolean";
  return (
    <div className={`group flex items-start gap-3 ${compact ? 'py-2' : 'py-3 border-b border-[#f0ede9] last:border-b-0'} ${animateIn ? 'animate-fadeSlideUp opacity-0' : 'opacity-100'}`} style={{ animationDelay: animateIn ? '0.05s' : '' }}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">{label}</p>
        {editable ? (
          isBoolean ? (
            <label className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => onChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-[#e8e6e4] text-[#0f172a] focus:ring-[#0f172a]"
              />
              <span className="text-sm font-medium text-[#64748b]">Enabled</span>
            </label>
          ) : (
            <input
              value={value as string}
              onChange={(e) => onChange?.(typeof value === 'number' ? Number(e.target.value) || 0 : e.target.value)}
              type={typeof value === 'number' ? 'number' : 'text'}
              className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="mt-0.5 text-base font-medium text-[#0f172a]">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'number' ? formatCurrency(value) : value || <span className="text-[#cbd5e1]">—</span>}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [product, setProduct] = useState<ProductProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProductProduct>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const p = await fetchProductById(id);
      setProduct(p);
      if (p) setEditForm({ name: p.name, default_code: p.default_code, list_price: p.list_price, sale_ok: p.sale_ok, purchase_ok: p.purchase_ok });
    } catch (err) {
      console.error("Failed to load product:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!product) return;
    setSaving(true);
    try {
      await updateProduct(product.id, { ...editForm });
      await load();
      setEditing(false);
    } catch (err) {
      alert(`Failed to update: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-[spin_1.5s_linear_infinite] rounded-full border-3 border-[#0f172a] border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#0f172a]">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-[#64748b] hover:text-[#0f172a]">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const initials = product.name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <div className="fixed left-0 top-0 -z-10 h-full w-full">
        <div className="absolute inset-0 bg-[#f8f7f5]" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#e8e4df] to-[#dcdad6] blur-[100px] opacity-50" />
      </div>

      <div className="relative mx-auto max-w-2xl px-5 py-10 md:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a] mb-6"
        >
          <ArrowLeft size={16} />
          All products
        </Link>

        {/* Main Card - Quotation Style */}
        <div className="rounded-2xl bg-[#fdfcfa] shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#e8e6e4]">
          {/* Header Section */}
          <div className="flex items-end justify-between gap-4 border-b border-[#f0ede9] p-5 md:p-6">
            <div className="flex items-end gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-xl font-bold text-white">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f172a]">{product.name}</h1>
                {product.default_code && (
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    <span className="font-mono">{product.default_code}</span>
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {product.sale_ok && (
                    <span className="inline-flex items-center rounded bg-[#dcfce7] px-2 py-0.5 text-xs font-semibold text-[#166534]">
                      For Sale
                    </span>
                  )}
                  {product.purchase_ok && (
                    <span className="inline-flex items-center rounded bg-[#fef3c7] px-2 py-0.5 text-xs font-semibold text-[#92400e]">
                      Purchasable
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] active:scale-[0.97]"
                >
                  <Edit2 size={14} />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      load();
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e8e4df] bg-white px-4 py-2 text-sm font-medium text-[#64748b] transition-all hover:bg-[#f8f7f5] active:scale-[0.97]"
                  >
                    <X size={14} />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] disabled:opacity-50 active:scale-[0.97]"
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-[spin_1s_linear_infinite] rounded-full border border-white/40 border-t-white" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Section - Two Column Layout */}
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-x-12 gap-y-1 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-0">
                <InfoRow
                  icon={Tag}
                  label="SKU / Code"
                  value={product.default_code || ""}
                  editable={editing}
                  onChange={(v) => setEditForm((p) => ({ ...p, default_code: v as string }))}
                  animateIn
                />
                <InfoRow
                  icon={Layers}
                  label="Category"
                  value={product.categ_id?.[1] || ""}
                  editable={false}
                  animateIn
                />
                <InfoRow
                  icon={Layers}
                  label="Unit of Measure"
                  value={product.uom_id?.[1] || ""}
                  editable={false}
                  animateIn
                />
              </div>

              {/* Right Column */}
              <div className="space-y-0">
                <InfoRow
                  icon={Tag}
                  label="Rate (TZS)"
                  value={product.list_price}
                  editable={editing}
                  onChange={(v) => setEditForm((p) => ({ ...p, list_price: v as any }))}
                  animateIn
                />
                <InfoRow
                  icon={Tag}
                  label="Available for Sale"
                  value={editForm.sale_ok ?? product.sale_ok}
                  editable={editing}
                  onChange={(v) => setEditForm((p) => ({ ...p, sale_ok: v as boolean }))}
                  animateIn
                />
                <InfoRow
                  icon={Tag}
                  label="Available for Purchase"
                  value={editForm.purchase_ok ?? product.purchase_ok}
                  editable={editing}
                  onChange={(v) => setEditForm((p) => ({ ...p, purchase_ok: v as boolean }))}
                  animateIn
                />
              </div>
            </div>

            {editing && (
              <div className="mt-6 rounded-lg border border-dashed border-[#e8e4df] bg-[#fbfaf9] p-4 text-center">
                <p className="text-xs text-[#94a3b8]">Edit fields above to update product details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
