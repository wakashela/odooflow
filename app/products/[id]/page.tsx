"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBackend } from "@/lib/data";
import { type ProductProduct } from "@/types/odoo";
import { ArrowLeft, Edit2, Tag, Layers, Check, X, Box } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function InfoRow({ icon: Icon, label, value, editable, onChange, isNumber, isBoolean, options }: { icon: React.ElementType; label: string; value: string | boolean | number; editable?: boolean; onChange?: (v: string | boolean | number) => void; isNumber?: boolean; isBoolean?: boolean; options?: { value: string; label: string }[] }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-hairline)] last:border-b-0">
      <div className="flex h-10 w-10 mt-1 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-muted)]">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        {editable ? (
          isBoolean ? (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[14px] font-medium text-[var(--color-muted)]">{label}</span>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)] mt-1">
                <span className="text-[16px] text-[var(--color-ink)]">Enabled</span>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => onChange?.(e.target.checked)}
                  className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
                />
              </label>
            </div>
          ) : options && options.length > 0 ? (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[14px] font-medium text-[var(--color-muted)]">{label}</span>
              <div className="flex gap-2 mt-1">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange?.(opt.value)}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                      value === opt.value
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                        : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Input
              label={label}
              value={value as string | number}
              onChange={(e) => onChange?.(isNumber ? Number(e.target.value) || 0 : e.target.value)}
              type={isNumber ? "number" : "text"}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <div>
            <p className="text-[14px] font-medium text-[var(--color-muted)] mb-1">{label}</p>
            <p className="text-[16px] text-[var(--color-ink)] font-medium">
              {typeof value === "boolean" ? (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold ${value ? "bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-hairline)]" : "bg-[var(--color-surface-soft)] text-[var(--color-muted)] border border-[var(--color-hairline)]"}`}>
                  {value ? "Yes" : "No"}
                </span>
              ) : isNumber ? formatCurrency(value as number) : value || <span className="text-[var(--color-muted)] font-normal italic text-[14px]">Not provided</span>}
            </p>
          </div>
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
    const backend = getBackend();
    try {
      setLoading(true);
      const p = await backend.fetchProductById(id);
      setProduct(p);
      if (p) {
        setEditForm({
          name: p.name,
          default_code: p.default_code,
          type: p.type,
          list_price: p.list_price,
          standard_price: p.standard_price,
          sale_ok: p.sale_ok,
          purchase_ok: p.purchase_ok,
        });
      }
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
      const backend = getBackend();
      await backend.updateProduct(product.id, { ...editForm });
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
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[22px] font-bold text-[var(--color-ink)]">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline">
            Back to products
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

  const typeLabel = product.type === "service" ? "Service" : "Product";
  const editType = editForm.type ?? product.type;
  const editSaleOk = editForm.sale_ok ?? product.sale_ok;
  const editPurchaseOk = editForm.purchase_ok ?? product.purchase_ok;

  return (
    <div className="w-full py-12 px-10 space-y-6">
      <Link href="/products" className="inline-flex items-center gap-2 text-[var(--color-ink)] font-medium mb-8 hover:underline">
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-2xl font-bold text-[var(--color-ink)] border border-[var(--color-hairline)]">
            {initials}
          </div>
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[var(--color-ink)]">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {product.default_code && (
                <span className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-[12px] font-mono font-medium text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                  {product.default_code}
                </span>
              )}
              <span className="inline-flex items-center rounded-lg bg-[var(--color-surface-soft)] px-3 py-1 text-[12px] font-bold text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                {typeLabel}
              </span>
              {product.sale_ok && (
                <span className="inline-flex items-center rounded-lg bg-[var(--color-surface-soft)] px-3 py-1 text-[12px] font-bold text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                  For Sale
                </span>
              )}
              {product.purchase_ok && (
                <span className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-[12px] font-bold text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                  Purchasable
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="w-full md:w-auto">
              <Edit2 size={16} />
              Edit Product
            </Button>
          ) : (
            <>
              <Button onClick={() => { setEditing(false); load(); }} variant="secondary" className="flex-1 md:flex-none">
                <X size={16} />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none min-w-[120px]">
                {saving ? "Saving..." : <><Check size={16} /> Save</>}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div className="space-y-2">
          <InfoRow
            icon={Tag}
            label="SKU / Code"
            value={product.default_code || ""}
            editable={editing}
            onChange={(v) => setEditForm((p) => ({ ...p, default_code: v as string }))}
          />
          <InfoRow
            icon={Box}
            label="Product Type"
            value={editType}
            editable={editing}
            onChange={(v) => setEditForm((p) => ({ ...p, type: v as "consu" | "service" }))}
            options={[
              { value: "consu", label: "Product" },
              { value: "service", label: "Service" },
            ]}
          />
          <InfoRow
            icon={Layers}
            label="Category"
            value={product.categ_id?.[1] || ""}
            editable={false}
          />
          <InfoRow
            icon={Layers}
            label="Unit of Measure"
            value={product.uom_id?.[1] || ""}
            editable={false}
          />
        </div>
        <div className="space-y-2">
          <InfoRow
            icon={Tag}
            label="Available for Sale"
            value={editSaleOk}
            editable={editing}
            onChange={(v) => setEditForm((p) => ({ ...p, sale_ok: v as boolean }))}
            isBoolean
          />
          {(!editing && product.sale_ok) || (editing && editSaleOk) ? (
            <InfoRow
              icon={Tag}
              label="Sale Price (TZS)"
              value={editForm.list_price ?? product.list_price}
              editable={editing}
              onChange={(v) => setEditForm((p) => ({ ...p, list_price: v as number }))}
              isNumber
            />
          ) : null}
          <InfoRow
            icon={Tag}
            label="Available for Purchase"
            value={editPurchaseOk}
            editable={editing}
            onChange={(v) => setEditForm((p) => ({ ...p, purchase_ok: v as boolean }))}
            isBoolean
          />
          {(!editing && product.purchase_ok) || (editing && editPurchaseOk) ? (
            <InfoRow
              icon={Tag}
              label="Purchase Price (TZS)"
              value={editForm.standard_price ?? product.standard_price}
              editable={editing}
              onChange={(v) => setEditForm((p) => ({ ...p, standard_price: v as number }))}
              isNumber
            />
          ) : null}
        </div>
      </div>

      {editing && (
        <div className="mt-12 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-4 text-center">
          <p className="text-[14px] font-medium text-[var(--color-ink)]">You are currently editing this product. Do not forget to save your changes.</p>
        </div>
      )}
    </div>
  );
}
