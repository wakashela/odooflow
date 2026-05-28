"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { getBackend } from "@/lib/data";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ResPartner } from "@/types/odoo";
import { Search, Edit2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (session) loadCustomers();
  }, [session]);

  async function loadCustomers() {
    const backend = getBackend();
    try {
      setLoading(true);
      const data = await backend.fetchCustomers();
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
      const backend = getBackend();
      await backend.updateCustomer(editingId, {
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

  async function _handleCreateQuick() {
    try {
      const name = `New Customer ${Date.now()}`;
      const backend = getBackend();
      const id = await backend.createCustomer({
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedCustomers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) setCurrentPage(1);
  }, [session, search]);

  return (
    <div className="w-full px-8 space-y-2">
      <div className="h-[64px] flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          Customers
        </h1>
        <div className="flex gap-2">
          <Link href="/customers/new">
            <Button>New Customer</Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[40px] rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] pl-12 pr-4 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:border-2 focus:outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-hairline)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-soft)] border-b border-[var(--color-hairline)]">
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-[30%]">Name</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Email</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">City</th>
                  <th className="px-4 py-1.5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hairline)]">
                {pagedCustomers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="hover:bg-[var(--color-surface-soft)] transition-colors cursor-pointer"
                  >
                    {editingId === c.id ? (
                      <>
                        <td className="px-4 py-2"><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className="h-8 text-sm" /></td>
                        <td className="px-4 py-2"><Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className="h-8 text-sm" /></td>
                        <td className="px-4 py-2"><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="h-8 text-sm" /></td>
                        <td className="px-4 py-2"><Input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" className="h-8 text-sm" /></td>
                        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button onClick={saveEdit} disabled={savingId === c.id} className="p-1 rounded text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] disabled:opacity-50" title="Save"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-1 rounded text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]" title="Cancel"><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-semibold text-[var(--color-ink)]">{c.name}</td>
                        <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{c.email || "-"}</td>
                        <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{c.phone || "-"}</td>
                        <td className="px-4 py-2 text-[14px] text-[var(--color-muted)]">{c.city || "-"}</td>
                        <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => startEdit(c)} className="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] transition-colors" title="Edit"><Edit2 size={14} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-muted)]">No customers found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--color-muted)]">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-[36px] rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
