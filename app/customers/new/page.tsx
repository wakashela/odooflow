"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/odoo/partner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [vat, setVat] = useState("");
  const [isCompany, setIsCompany] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a customer name");
      return;
    }

    setSaving(true);
    try {
      await createCustomer({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        vat: vat.trim() || undefined,
        is_company: isCompany,
      });
      router.push("/customers");
    } catch (err) {
      alert(`Failed to create customer: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

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
          <div className="border-b border-[#f0ede9] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0f172a] text-white">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0f172a]">New Customer</h1>
                <p className="text-xs text-[#64748b]">Create a new customer record</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-0">
                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Name</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">Customer Name *</p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>
                </div>

                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Email</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">Email Address</p>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., contact@example.com"
                    />
                  </div>
                </div>

                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Street</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">Street Address</p>
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>
                </div>

                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">VAT</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">VAT Number</p>
                    <input
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., 40-315066-K"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-0">
                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Phone</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">Phone Number</p>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., +1 555 123 4567"
                    />
                  </div>
                </div>

                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">City</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">City</p>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-0.5 w-full bg-transparent text-base font-medium text-[#0f172a] placeholder-[#cbd5e1] outline-none focus:ring-0"
                      placeholder="e.g., Dar es Salaam"
                    />
                  </div>
                </div>

                <div className="group flex items-start gap-3 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0ede9] text-[#0f172a] transition-colors group-hover:bg-[#e8e4df]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Type</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">Company Status</p>
                    <label className="mt-1 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isCompany}
                        onChange={(e) => setIsCompany(e.target.checked)}
                        className="h-4 w-4 rounded border-[#e8e6e4] text-[#0f172a] focus:ring-[#0f172a]"
                      />
                      <span className="text-sm font-medium text-[#64748b]">Is a company</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-[#f0ede9] px-5 py-4 md:px-6 md:py-5">
            <Link href="/customers">
              <button className="rounded-lg border border-[#e8e4df] bg-white px-4 py-2 text-sm font-medium text-[#64748b] transition-all hover:bg-[#f8f7f5] active:scale-[0.97]">
                Cancel
              </button>
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white shadow-sm shadow-[#0f172a]/20 transition-all hover:bg-[#1e293b] disabled:opacity-50 active:scale-[0.97]"
            >
              {saving ? (
                <div className="h-4 w-4 animate-[spin_1s_linear_infinite] rounded-full border border-white/40 border-t-white" />
              ) : (
                <Plus size={14} />
              )}
              <span>Create Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
