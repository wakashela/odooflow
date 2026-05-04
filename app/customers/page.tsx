"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { fetchCustomers, updateCustomer, createCustomer } from "@/lib/odoo/partner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ResPartner } from "@/types/odoo";
import { Search, Plus, Edit2, Check, X } from "lucide-react";

export default function CustomersPage() {
  const { session } = useAuthStore();
  const router = useRouter();
  const [customers, setCustomers] = useState<ResPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStreet, setEditStreet] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editVat, setEditVat] = useState("");
  const [editIsCompany, setEditIsCompany] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (session) loadCustomers();
  }, [session]);

  async function loadCustomers() {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: ResPartner) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmail(c.email || "");
    setEditPhone(c.phone || "");
    setEditStreet(c.street || "");
    setEditCity(c.city || "");
    setEditVat(c.vat || "");
    setEditIsCompany(c.is_company || false);
  }

  async function saveEdit() {
    if (editingId === null || !editName.trim()) return;
    setSavingId(editingId);
    try {
      await updateCustomer(editingId, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        street: editStreet.trim() || undefined,
        city: editCity.trim() || undefined,
        vat: editVat.trim() || undefined,
        is_company: editIsCompany,
      });
      await loadCustomers();
      setEditingId(null);
    } catch (err) {
      alert(`Failed to update customer: ${(err as Error).message}`);
    } finally {
      setSavingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleCreateQuick() {
    try {
      const name = `New Customer ${Date.now()}`;
      const id = await createCustomer({
        name,
        is_company: false,
      });
      router.push(`/customers/${id}`);
    } catch (err) {
      alert(`Failed to create customer: ${(err as Error).message}`);
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Customers
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateQuick}>
            <Plus size={14} />
            Quick Create
          </Button>
          <Link href="/customers/new">
            <Button>New Customer</Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
        />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--color-text-light)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="hover:shadow-md transition-shadow mb-2">
              <Card padding="none" className="hover:shadow-md transition-shadow">
                {editingId === c.id ? (
                  <div className="flex items-center gap-3 px-6 py-4">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Customer name"
                      />
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                        type="email"
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Phone"
                      />
                      <Input
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={editStreet}
                        onChange={(e) => setEditStreet(e.target.value)}
                        placeholder="Street"
                      />
                      <Input
                        value={editVat}
                        onChange={(e) => setEditVat(e.target.value)}
                        placeholder="VAT"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={editIsCompany}
                          onChange={(e) => setEditIsCompany(e.target.checked)}
                          className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        Company
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={saveEdit}
                          disabled={savingId === c.id}
                          className="p-1.5 rounded text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] disabled:opacity-50"
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-border-light)]"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href={`/customers/${c.id}`} className="flex items-center justify-between px-6 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
                        {c.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{c.city || "-"} {c.phone ? `· ${c.phone}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-[var(--color-text-muted)]">{c.email || "-"}</p>
                      </div>
                       <button
                         onClick={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                           startEdit(c);
                         }}
                         className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border-light)] transition-colors"
                         title="Edit"
                       >
                         <Edit2 size={14} />
                       </button>
                    </div>
                  </Link>
                )}
              </Card>
            </div>
          ))}
          {filtered.length === 0 && (
            <Card className="py-12 text-center text-[var(--color-text-muted)]">No customers found</Card>
          )}
        </div>
      )}
    </div>
  );
}
