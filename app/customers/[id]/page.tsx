"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCustomerById, updateCustomer } from "@/lib/odoo/partner";
import { type ResPartner } from "@/types/odoo";
import { ArrowLeft, Edit2, Phone, Mail, MapPin, Building2, Check, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function InfoRow({ icon: Icon, label, value, editable, onChange }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; value: string | boolean | number; editable?: boolean; onChange?: (v: string | boolean | number) => void }) {
  const isBoolean = typeof value === "boolean";
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
          ) : (
            <Input
              label={label}
              value={value as string}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <div>
            <p className="text-[14px] font-medium text-[var(--color-muted)] mb-1">{label}</p>
            <p className="text-[16px] text-[var(--color-ink)] font-medium">
              {typeof value === 'boolean' ? (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold ${value ? 'bg-[var(--color-surface-soft)] text-[var(--color-ink)] border border-[var(--color-hairline)]' : 'bg-[var(--color-surface-soft)] text-[var(--color-muted)] border border-[var(--color-hairline)]'}`}>
                  {value ? 'Yes' : 'No'}
                </span>
              ) : value || <span className="text-[var(--color-muted)] font-normal italic text-[14px]">Not provided</span>}
            </p>
          </div>
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
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[22px] font-bold text-[var(--color-ink)]">Customer not found</p>
          <Link href="/customers" className="mt-4 inline-block text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline">
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
    <div className="w-full py-12 px-10">
      <Link href="/customers" className="inline-flex items-center gap-2 text-[var(--color-ink)] font-medium mb-8 hover:underline">
        <ArrowLeft size={16} />
        Back to Customers
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-2xl font-bold text-[var(--color-ink)] border border-[var(--color-hairline)]">
            {initials}
          </div>
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[var(--color-ink)]">{customer.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {customer.vat && (
                <span className="inline-flex items-center rounded-lg bg-white px-3 py-1 text-[12px] font-mono font-medium text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                  {customer.vat}
                </span>
              )}
              {customer.is_company && (
                <span className="inline-flex items-center rounded-lg bg-[var(--color-surface-soft)] px-3 py-1 text-[12px] font-bold text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-sm">
                  Company
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="w-full md:w-auto">
              <Edit2 size={16} />
              Edit Customer
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
          <InfoRow icon={Mail} label="Email Address" value={editForm.email ?? customer.email ?? ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, email: v as string }))} />
          <InfoRow icon={MapPin} label="Street Address" value={editForm.street ?? customer.street ?? ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, street: v as string }))} />
          <InfoRow icon={Building2} label="City" value={editForm.city ?? customer.city ?? ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, city: v as string }))} />
        </div>
        <div className="space-y-2">
          <InfoRow icon={Phone} label="Phone Number" value={editForm.phone ?? customer.phone ?? ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, phone: v as string }))} />
          <InfoRow icon={Building2} label="VAT Number" value={editForm.vat ?? customer.vat ?? ""} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, vat: v as string }))} />
          <InfoRow icon={Building2} label="Is a Company" value={editForm.is_company ?? customer.is_company} editable={editing} onChange={(v) => setEditForm((p) => ({ ...p, is_company: v as boolean }))} />
        </div>
      </div>

      {editing && (
        <div className="mt-12 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] p-4 text-center">
          <p className="text-[14px] font-medium text-[var(--color-ink)]">You are currently editing this profile. Don&apos;t forget to save your changes.</p>
        </div>
      )}
    </div>
  );
}
