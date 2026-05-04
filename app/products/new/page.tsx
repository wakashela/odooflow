"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/odoo/partner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [defaultCode, setDefaultCode] = useState("");
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/products" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          New Product
        </h1>
      </div>

      <Card>
        <div className="space-y-4 p-6">
          <Input
            label="Product Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Laptop Pro 15"
          />
          <Input
            label="SKU / Default Code"
            value={defaultCode}
            onChange={(e) => setDefaultCode(e.target.value)}
            placeholder="e.g., LP-1500-BLK"
          />
          <Input
            label="Rate (TZS)"
            type="number"
            value={listPrice || ""}
            onChange={(e) => setListPrice(Number(e.target.value) || 0)}
            min={0}
            step={0.01}
          />

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saleOk}
                onChange={(e) => setSaleOk(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Can be sold</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={purchaseOk}
                onChange={(e) => setPurchaseOk(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text)]">Can be purchased</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <Link href="/products">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create Product"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
