"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCustomerById, updateCustomer } from "@/lib/odoo/partner";
import { type ResPartner } from "@/types/odoo";
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Building2, Check, X } from "lucide-react";

function InfoRow({ icon: Icon, label, value, editable, onChange, animateIn, compact }: { icon: any; label: string; value: string | boolean | number; editable?: boolean; onChange?: (v: string | boolean) => void; animateIn?: boolean; compact?: boolean }) {
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
              onChange={(e) => onChange?.(e.target.value)}
              className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="mt-0.5 text-base font-medium text-[#0f172a]">
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || <span className="text-[#cbd5e1]">—</span>}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [customer, setCustomer] = useState<ResPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ResPartner>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const p = await fetchCustomerById(id);
      setCustomer(p);
      if (p) setEditForm({ email: p.email, phone: p.phone, street: p.street, city: p.city, vat: p.vat, is_company: p.is_company });
    } catch (err) {
      console.error("Failed to load customer:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!customer) return;
    setSaving(true);
    try {
      await updateCustomer(customer.id, { ...editForm, name: customer.name });
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

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#0f172a]">Customer not found</p>
          <Link href="/customers" className="mt-4 inline-block text-[#64748b] hover:text-[#0f172a]">
            ← Back to customers
          </Link>
        </div>
      </div>
    );
  }

  const initials = customer.name
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
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a] mb-6"
        >
          <ArrowLeft size={16} />
          All customers
        </Link>

        {/* Main Card - Quotation Style */}
        <div className="rounded-2xl bg-[#fdfcfa] shadow-[0_2px_8px_rgba(15,23,42,0.04)] border border-[#e8e6e4]">
          {/* Header Section */}
          <div className="flex items-end justify-between gap-4 border-b border-[#f0ede9] p-5 md:p-6">
            <div className="flex items-end gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-2xl font-bold text-white">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f172a]">{customer.name}</h1>
                {customer.vat && (
                  <p className="mt-0.5 text-xs text-[#64748b]">
                    <span className="font-mono">{customer.vat}</span>
                  </p>
                )}
                {customer.is_company && (
                  <span className="mt-1.5 inline-flex items-center rounded bg-[#fef3c7] px-2 py-0.5 text-xs font-semibold text-[#92400e]">
                    Company
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] active:scale-[0.97]"
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
                    className="flex items-center gap-1.5 rounded-lg border border-[#e8e4df] bg-white px-4 py-2 text-sm font-medium text-[#64748b] transition-all hover:bg-[#f8f7f5] active:scale-[0.97]"
                  >
                    <X size={14} />
                    Cancel
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
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Section - Two Column */}
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
              <div className="space-y-0">
                <InfoRow icon={Mail} label="Email" value={customer.email || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, email: v as string }))} animateIn />
                <InfoRow icon={MapPin} label="Street" value={customer.street || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, street: v as string }))} animateIn />
                <InfoRow icon={Building2} label="City" value={customer.city || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, city: v as string }))} animateIn />
              </div>
              <div className="space-y-0">
                <InfoRow icon={Phone} label="Phone" value={customer.phone || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, phone: v as string }))} animateIn />
                <InfoRow icon={Building2} label="VAT" value={customer.vat || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, vat: v as string }))} animateIn />
                <InfoRow icon={Building2} label="Is Company" value={editForm.is_company ?? customer.is_company} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, is_company: v as boolean }))} animateIn />
              </div>
            </div>

            {editing && (
              <div className="mt-6 rounded-lg border border-dashed border-[#e8e4df] bg-[#fbfaf9] p-4 text-center">
                <p className="text-xs text-[#94a3b8]">Edit fields above to update customer details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
