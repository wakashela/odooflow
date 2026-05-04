"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/odoo/partner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          New Customer
        </h1>
      </div>

      <Card>
        <div className="space-y-4 p-6">
          <Input
            label="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Acme Corporation"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., contact@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., +1 555 123 4567"
          />
          <Input
            label="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g., 123 Main Street"
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Dar es Salaam"
          />
          <Input
            label="VAT Number"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            placeholder="e.g., 40-315066-K"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isCompany}
              onChange={(e) => setIsCompany(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-text)]">Is a company</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <Link href="/customers">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Create Customer"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
