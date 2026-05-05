"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/odoo/partner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
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
    <div className="w-full py-12 px-10 space-y-6">
      <Link href="/products" className="inline-flex items-center gap-2 text-[var(--color-ink)] font-medium mb-8 hover:underline">
        <ArrowLeft size={16} />
        Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">New Product</h1>
        <p className="mt-2 text-[16px] text-[var(--color-muted)]">Add a new product or service</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Input 
            label="Product Name *" 
            placeholder="e.g., Laptop Pro 15" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <Input 
            label="SKU / Default Code" 
            placeholder="e.g., LP-1500-BLK" 
            value={defaultCode} 
            onChange={(e) => setDefaultCode(e.target.value)} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium text-[var(--color-muted)]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3.5 py-3 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:border-2 focus:outline-none transition-colors resize-none"
              placeholder="Brief product description..."
              rows={3}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Input 
            label="Rate (TZS)" 
            type="number"
            placeholder="0.00" 
            min={0}
            step={0.01}
            value={listPrice || ""} 
            onChange={(e) => setListPrice(Number(e.target.value) || 0)} 
          />
          
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[14px] font-medium text-[var(--color-muted)]">Availability Settings</span>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)]">
              <span className="text-[16px] text-[var(--color-ink)]">Available for Sale</span>
              <input
                type="checkbox"
                checked={saleOk}
                onChange={(e) => setSaleOk(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)] mt-2">
              <span className="text-[16px] text-[var(--color-ink)]">Available for Purchase</span>
              <input
                type="checkbox"
                checked={purchaseOk}
                onChange={(e) => setPurchaseOk(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center justify-end gap-4 pt-6 border-t border-[var(--color-hairline)]">
        <Link href="/products">
          <Button variant="tertiary-text">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
          {saving ? "Saving..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
