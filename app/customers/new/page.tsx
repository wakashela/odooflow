"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBackend } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
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
  const [x_tin, setXTin] = useState("");
  const [isCompany, setIsCompany] = useState(true);

  async function handleSave() {
    if (!name.trim()) {
      alert("Please enter a customer name");
      return;
    }

    setSaving(true);
    try {
      const backend = getBackend();
      await backend.createCustomer({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        vat: vat.trim() || undefined,
        x_tin: x_tin.trim() || undefined,
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
    <div className="w-full py-12 px-10">
      <Link href="/customers" className="inline-flex items-center gap-2 text-[var(--color-ink)] font-medium mb-8 hover:underline">
        <ArrowLeft size={16} />
        Back to Customers
      </Link>

      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-ink)]">New Customer</h1>
        <p className="mt-2 text-[16px] text-[var(--color-muted)]">Add a new partner to your directory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Input 
            label="Customer Name *" 
            placeholder="e.g., Acme Corporation" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="e.g., contact@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            label="Street Address" 
            placeholder="e.g., 123 Main Street" 
            value={street} 
            onChange={(e) => setStreet(e.target.value)} 
          />
          <Input 
            label="VRN" 
            placeholder="e.g., 40-315066-K" 
            value={vat} 
            onChange={(e) => setVat(e.target.value)} 
          />
          <Input 
            label="TIN" 
            placeholder="e.g., 168-782-179" 
            value={x_tin} 
            onChange={(e) => setXTin(e.target.value)} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Input 
            label="Phone Number" 
            placeholder="e.g., +1 555 123 4567" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <Input 
            label="City" 
            placeholder="e.g., Dar es Salaam" 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
          />
          
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[14px] font-medium text-[var(--color-muted)]">Entity Type</span>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)]">
              <span className="text-[16px] text-[var(--color-ink)]">Is a Company</span>
              <input
                type="checkbox"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center justify-end gap-4 pt-6 border-t border-[var(--color-hairline)]">
        <Link href="/customers">
          <Button variant="tertiary-text">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
          {saving ? "Saving..." : "Create Customer"}
        </Button>
      </div>
    </div>
  );
}
