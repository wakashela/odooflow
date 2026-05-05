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
    <div className={`group flex items-start gap-3 py-2 border-b border-slate-100/50 last:border-b-0 ${animateIn ? 'animate-fadeSlideUp opacity-0' : 'opacity-100'}`} style={{ animationDelay: animateIn ? '0.05s' : '' }}>
      <div className="flex h-8 w-8 mt-0.5 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 transition-all duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-110">
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        {editable ? (
          isBoolean ? (
            <label className="group/toggle relative flex cursor-pointer items-center justify-between rounded-lg border border-slate-200/60 bg-white/50 px-2.5 py-1.5 transition-all hover:bg-white hover:border-indigo-200 mt-1">
              <span className="text-sm font-semibold text-slate-700 group-hover/toggle:text-slate-900">Enabled</span>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => onChange?.(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-4 w-7 rounded-full bg-slate-200 transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:bg-indigo-600"></div>
                <div className="absolute left-[2px] top-[2px] h-3 w-3 rounded-full border border-slate-300 bg-white transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
              </div>
            </label>
          ) : (
            <input
              value={value as string}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full bg-white/50 border border-slate-200/60 focus:bg-white focus:border-indigo-500/50 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 mt-0.5"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="text-sm font-semibold text-slate-900">
            {typeof value === 'boolean' ? (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${value ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            ) : value || <span className="text-slate-300 font-normal italic text-xs">Not provided</span>}
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
    <div className="min-h-screen bg-[#f8f7f5] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#f8f7f5]" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-6 md:px-8 lg:px-12">
        <Link
          href="/customers"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-all hover:text-slate-900 mb-4 bg-white/50 hover:bg-white px-3 py-1.5 rounded-full border border-white/60 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          All Customers
        </Link>

        {/* Main Card */}
        <div className="rounded-[1.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white overflow-hidden transition-all duration-500 hover:shadow-[0_16px_60px_rgb(0,0,0,0.08)]">
          {/* Header Section */}
          <div className="relative overflow-hidden p-5 md:p-6 border-b border-slate-100/50">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-xl font-bold text-white shadow-lg shadow-slate-900/20 ring-4 ring-white/50">
                  {initials}
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{customer.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {customer.vat && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-600 border border-slate-200/60">
                        {customer.vat}
                      </span>
                    )}
                    {customer.is_company && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100/60">
                        Company
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30 active:scale-[0.98]"
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
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow active:scale-[0.98]"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30 disabled:opacity-70 active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      {saving ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <Check size={14} strokeWidth={3} className="transition-transform group-hover:scale-110 duration-300" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-0 md:grid-cols-2">
              <div className="space-y-0">
                <InfoRow icon={Mail} label="Email Address" value={customer.email || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, email: v as string }))} animateIn />
                <InfoRow icon={MapPin} label="Street Address" value={customer.street || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, street: v as string }))} animateIn />
                <InfoRow icon={Building2} label="City" value={customer.city || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, city: v as string }))} animateIn />
              </div>
              <div className="space-y-0">
                <InfoRow icon={Phone} label="Phone Number" value={customer.phone || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, phone: v as string }))} animateIn />
                <InfoRow icon={Building2} label="VAT Number" value={customer.vat || ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, vat: v as string }))} animateIn />
                <InfoRow icon={Building2} label="Is a Company" value={editForm.is_company ?? customer.is_company} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, is_company: v as boolean }))} animateIn />
              </div>
            </div>

            {editing && (
              <div className="mt-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-3 text-center animate-fadeSlideUp">
                <p className="text-xs font-semibold text-indigo-700">You are currently editing this profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
