"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/odoo/partner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [defaultCode, setDefaultCode] = useState("");
  const [description, setDescription] = useState("");
  const [listPrice, setListPrice] = useState(0);
  const [saleOk, setSaleOk] = useState(true);
  const [purchaseOk, setPurchaseOk] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a product name");
      return;
    }

    setSaving(true);
    try {
      await createProduct({
        name: name.trim(),
        default_code: defaultCode.trim() || undefined,
        description_sale: description.trim() || undefined,
        list_price: listPrice,
        sale_ok: saleOk,
        purchase_ok: purchaseOk,
      });
      router.push("/products");
    } catch (err) {
      alert(`Failed to create product: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7f5] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#f8f7f5]" />
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/40 blur-[120px] mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
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
            <div className="relative flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/20 ring-4 ring-white/50">
                <Plus size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>New Product</h1>
                <p className="mt-1.5 text-sm font-medium text-slate-500">Add a new product or service</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 md:p-10">
            <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Product Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200/60 focus:bg-white focus:border-emerald-500/50 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] rounded-xl px-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
                    placeholder="e.g., Laptop Pro 15"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-3.5">SKU / Default Code</label>
                  <input
                    value={defaultCode}
                    onChange={(e) => setDefaultCode(e.target.value)}
                    className="w-full bg-white/50 border border-slate-200/60 focus:bg-white focus:border-emerald-500/50 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] rounded-xl px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 font-mono"
                    placeholder="e.g., LP-1500-BLK"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-3.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full resize-none bg-white/50 border border-slate-200/60 focus:bg-white focus:border-emerald-500/50 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] rounded-xl px-4 py-3 text-base font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
                    placeholder="Brief product description..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-3.5">Rate (TZS)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">TZS</span>
                    <input
                      value={listPrice || ""}
                      onChange={(e) => setListPrice(Number(e.target.value) || 0)}
                      type="number"
                      className="w-full bg-white/50 border border-slate-200/60 focus:bg-white focus:border-emerald-500/50 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] rounded-xl pl-14 pr-4 py-3 text-base font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-3.5">Availability Settings</label>
                  
                  <label className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 transition-all hover:bg-white hover:border-emerald-200">
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Available for Sale</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={saleOk}
                        onChange={(e) => setSaleOk(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 peer-checked:bg-emerald-600"></div>
                      <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
                    </div>
                  </label>

                  <label className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-4 py-3 transition-all hover:bg-white hover:border-emerald-200">
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Available for Purchase</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={purchaseOk}
                        onChange={(e) => setPurchaseOk(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 peer-checked:bg-emerald-600"></div>
                      <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-300 bg-white transition-transform peer-checked:translate-x-full peer-checked:border-white"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-4 bg-slate-50/50 p-6 md:px-10 border-t border-slate-100/50 backdrop-blur-sm">
            <Link href="/products">
              <button className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 hover:shadow active:scale-[0.98]">
                Cancel
              </button>
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 disabled:opacity-70 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Plus size={16} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-300" />
              )}
              <span>Create Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
