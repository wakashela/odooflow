"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCustomerById, updateCustomer } from "@/lib/odoo/partner";
import { type ResPartner } from "@/types/odoo";
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Building2, Check, X } from "lucide-react";

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

  const InfoRow = ({ icon: Icon, label, value, editable, onChange, animateIn }: { icon: any; label: string; value: string; editable?: boolean; onChange?: (v: string) => void; animateIn?: boolean }) => (
    <div className={`group relative flex items-start gap-4 rounded-2xl border border-[#e8e6e4] bg-[#fbfaf9] p-5 transition-all duration-500 hover:border-[#dcdbd9] hover:bg-[#fefbf9] ${animateIn ? 'animate-fadeSlideUp opacity-0' : 'opacity-100'}`} style={{ animationDelay: animateIn ? '0.1s' : '' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f172a] text-white transition-transform duration-300 group-hover:scale-105">
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</p>
        {editing && editable ? (
          <input
            value={editForm[label.toLowerCase() as keyof Partial<ResPartner>] as string || value}
            onChange={(e) => onChange?.(e.target.value)}
            className="mt-1.5 w-full bg-transparent text-lg font-medium text-[#0f172a] placeholder-[#94a3b8] outline-none focus:ring-0"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="mt-1.5 text-lg font-medium text-[#0f172a]">{value || <span className="text-[#cbd5e1]">Not provided</span>}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-[spin_2s_linear_infinite] rounded-full border-3 border-[#0f172a] border-t-transparent" />
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
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#e8e4df] to-[#dcdad6] blur-[80px] opacity-60" />

      <div className="relative mx-auto max-w-3xl px-6 py-16 md:px-8 lg:px-12">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a]"
        >
          <ArrowLeft size={16} />
          All customers
        </Link>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#0f172a] text-2xl font-bold text-white shadow-lg transition-transform duration-500 hover:scale-105">
                {initials}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#0f172a] transition-colors duration-300">{customer.name}</h1>
                {customer.vat && (
                  <p className="mt-1 text-sm text-[#64748b]">
                    VAT: <span className="font-mono">{customer.vat}</span>
                  </p>
                )}
                {customer.is_company && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e8e4df] px-3 py-1 text-xs font-medium text-[#64748b]">
                    <Building2 size={12} />
                    Company
                  </span>
                )}
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
            <InfoRow icon={Mail} label="Email" value={customer.email || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} animateIn />
            <InfoRow icon={Phone} label="Phone" value={customer.phone || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} animateIn />
            <InfoRow icon={MapPin} label="Street" value={customer.street || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, street: v }))} animateIn />
            <InfoRow icon={Building2} label="City" value={customer.city || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, city: v }))} animateIn />
          </div>

          {editing && (
            <div className="mt-8 rounded-2xl border border-dashed border-[#e8e4df] bg-[#fbfaf9] p-8 text-center">
              <p className="text-sm text-[#94a3b8]">Edit fields above to update customer details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
