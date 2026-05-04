"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProductById, updateProduct } from "@/lib/odoo/partner";
import { type ProductProduct } from "@/types/odoo";
import { ArrowLeft, Edit2, Tag, Layers, Check, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function InfoRow({ icon: Icon, label, value, editable, onChange, animateIn }: { icon: any; label: string; value: string | boolean | number; editable?: boolean; onChange?: (v: string | boolean | number) => void; animateIn?: boolean }) {
  const isBoolean = typeof value === "boolean";
  return (
    <div className={`group relative flex items-start gap-4 rounded-2xl border border-[#e8e6e4] bg-[#fbfaf9] p-5 transition-all duration-500 hover:border-[#dcdbd9] hover:bg-[#fefbf9] ${animateIn ? 'animate-fadeSlideUp opacity-0' : 'opacity-100'}`} style={{ animationDelay: animateIn ? '0.1s' : '' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-white transition-transform duration-300 group-hover:scale-105">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</p>
        {editable ? (
          isBoolean ? (
            <label className="mt-1.5 flex items-center gap-2">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => onChange?.(e.target.checked)}
                className="h-4 w-4 rounded border-[#e8e6e4] text-[#0f172a] focus:ring-[#0f172a]"
              />
              <span className="text-sm text-[#64748b]">Enabled</span>
            </label>
          ) : (
            <input
              value={value as string}
              onChange={(e) => onChange?.(typeof value === 'number' ? Number(e.target.value) || 0 : e.target.value)}
              type={typeof value === 'number' ? 'number' : 'text'}
              className="mt-1.5 w-full bg-transparent text-lg font-medium text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-0"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="mt-1.5 text-lg font-medium text-[#0f172a]">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'number' ? formatCurrency(value) : value || <span className="text-[#cbd5e1]">Not provided</span>}
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
        <div className="h-12 w-12 animate-[spin_2s_linear_infinite] rounded-full border-3 border-[#0f172a] border-t-transparent" />
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
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#e8e4df] to-[#dcdad6] blur-[80px] opacity-60" />

      <div className="relative mx-auto max-w-3xl px-6 py-16 md:px-8 lg:px-12">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
        >
          <ArrowLeft size={16} />
          All products
        </Link>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-2xl font-bold text-white shadow-lg transition-transform duration-500 hover:scale-105">
                {initials}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#0f172a] transition-colors duration-300">{product.name}</h1>
                {product.default_code && (
                  <p className="mt-1 text-sm text-[#64748b]">
                    SKU: <span className="font-mono">{product.default_code}</span>
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  {product.sale_ok && (
                    <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                      For Sale
                    </span>
                  )}
                  {product.purchase_ok && (
                    <span className="inline-flex items-center rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-xs font-medium text-[#92400e]">
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
                  className="flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] active:scale-[0.98]"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      load();
                    }}
                    className="flex items-center gap-2 rounded-full border border-[#e8e4df] bg-white px-5 py-2.5 text-sm font-medium text-[#64748b] transition-all hover:bg-[#f8f7f5] active:scale-[0.98]"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] disabled:opacity-50 active:scale-[0.98]"
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-[spin_1s_linear_infinite] rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Check size={14} />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <InfoRow icon={Tag} label="SKU" value={product.default_code || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, default_code: v as string }))} animateIn />
            <InfoRow icon={Layers} label="Category" value={product.categ_id?.[1] || ""} editable={false} animateIn />
            <InfoRow icon={Layers} label="UoM" value={product.uom_id?.[1] || ""} editable={false} animateIn />
            <InfoRow icon={Tag} label="Rate (TZS)" value={product.list_price} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, list_price: v as any }))} animateIn />
            <InfoRow icon={Tag} label="Can be sold" value={editForm.sale_ok ?? product.sale_ok} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, sale_ok: v as boolean }))} animateIn />
            <InfoRow icon={Tag} label="Can be purchased" value={editForm.purchase_ok ?? product.purchase_ok} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, purchase_ok: v as boolean }))} animateIn />
          </div>

          {editing && (
            <div className="mt-8 rounded-2xl border border-dashed border-[#e8e4df] bg-[#fbfaf9] p-8 text-center">
              <p className="text-sm text-[#94a3b8]">Edit fields above to update product details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
