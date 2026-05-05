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
  const isNumber = typeof value === "number";
  return (
    <div className={`group flex items-start gap-4 ${compact ? 'py-3' : 'py-4 border-b border-slate-100/50 last:border-b-0'} ${animateIn ? 'animate-fadeSlideUp opacity-0' : 'opacity-100'}`} style={{ animationDelay: animateIn ? '0.05s' : '' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 transition-all duration-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:scale-110">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
        {editable ? (
          isBoolean ? (
            <label className="group/toggle relative flex cursor-pointer items-center justify-between rounded-lg border border-slate-200/60 bg-white/50 px-3 py-2 transition-all hover:bg-white hover:border-emerald-200 mt-1">
              <span className="text-sm font-semibold text-slate-700 group-hover/toggle:text-slate-900">Enabled</span>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => onChange?.(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 peer-checked:bg-emerald-600"></div>
                <div className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full border border-slate-300 bg-white transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
              </div>
            </label>
          ) : (
            <input
              value={value as string | number}
              onChange={(e) => onChange?.(isNumber ? Number(e.target.value) || 0 : e.target.value)}
              type={isNumber ? 'number' : 'text'}
              className="w-full bg-white/50 border border-slate-200/60 focus:bg-white focus:border-emerald-500/50 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="text-base font-semibold text-slate-900">
            {typeof value === 'boolean' ? (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            ) : isNumber ? formatCurrency(value as number) : value || <span className="text-slate-300 font-normal italic">Not provided</span>}
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
    <div className="min-h-screen bg-[#f8f7f5] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#f8f7f5]" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-200/40 to-blue-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-12 md:px-8 lg:px-12">
        <Link
          href="/products"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-900 mb-8 bg-white/50 hover:bg-white px-4 py-2 rounded-full border border-white/60 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          All Products
        </Link>

        {/* Main Card */}
        <div className="rounded-[2rem] bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-500 hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)]">
          {/* Header Section */}
          <div className="relative overflow-hidden p-8 md:p-10 border-b border-slate-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex items-center sm:items-end gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-2xl font-bold text-white shadow-xl shadow-slate-900/20 ring-4 ring-white/50">
                  {initials}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{product.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {product.default_code && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-medium text-slate-600 border border-slate-200/60">
                        {product.default_code}
                      </span>
                    )}
                    {product.sale_ok && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100/60">
                        For Sale
                      </span>
                    )}
                    {product.purchase_ok && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-100/60">
                        Purchasable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 active:scale-[0.98]"
                  >
                    <Edit2 size={16} />
                    <span className="hidden sm:inline">Edit Product</span>
                    <span className="sm:hidden">Edit</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        load();
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow active:scale-[0.98]"
                    >
                      <X size={16} />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 disabled:opacity-70 active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      {saving ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <Check size={16} strokeWidth={3} className="transition-transform group-hover:scale-110 duration-300" />
                      )}
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 gap-x-12 gap-y-2 md:grid-cols-2">
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
              <div className="mt-8 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-center animate-fadeSlideUp">
                <p className="text-sm font-semibold text-emerald-700">You are currently editing this product</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
