"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuotation } from "@/lib/odoo/sale";
import { fetchCustomers, fetchProducts, searchPartners } from "@/lib/odoo/partner";
import { formatCurrency, computeLineAmount } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { ResPartner, ProductProduct } from "@/types/odoo";
import type { LineItem } from "@/types/documents";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

let nextLineId = -1;

export default function NewQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<ResPartner[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<ResPartner[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const [productQueries, setProductQueries] = useState<Record<number, string>>({});

  const [partnerId, setPartnerId] = useState(0);
  const [validityDate, setValidityDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchProducts()]).then(([custs, prods]) => {
      setCustomers(custs);
      setProducts(prods);
    });
  }, []);

  // Customer search (debounced)
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!customerQuery.trim()) {
        setCustomerSuggestions([]);
        return;
      }
      setCustomerSearching(true);
      try {
        const results = await searchPartners(customerQuery, 20);
        if (!active) return;
        setCustomerSuggestions(results);
      } catch (err) {
        console.error("Failed to search partners:", err);
      } finally {
        if (active) setCustomerSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery]);

  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const taxAmount = subtotal * 0.18;
  const total = subtotal + taxAmount;

  function addLine() {
    const newLine: LineItem = {
      id: nextLineId--,
      productId: undefined,
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
    };
    setLines([...lines, newLine]);
  }

  function updateLine(id: number, field: keyof LineItem, value: unknown) {
    setLines(
      lines.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        updated.subtotal = computeLineAmount(updated.quantity, updated.unitPrice, updated.discount);
        return updated;
      })
    );
  }

  function selectProduct(lineId: number, productId: number) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines(
      lines.map((l) => {
        if (l.id !== lineId) return l;
        const updated = {
          ...l,
          productId: product.id,
          productLabel: product.default_code || product.name,
          description: `${product.default_code ? product.default_code + " - " : ""}${product.name}`,
          unitPrice: product.list_price,
        };
        updated.subtotal = computeLineAmount(updated.quantity, updated.unitPrice, updated.discount);
        return updated;
      })
    );
  }

  function removeLine(id: number) {
    setLines(lines.filter((l) => l.id !== id));
  }

  async function handleSave() {
    if (!partnerId) {
      alert("Please select a customer");
      return;
    }
    if (lines.length === 0) {
      alert("Please add at least one line item");
      return;
    }

    setSaving(true);
    try {
      const orderId = await createQuotation({
        partner_id: partnerId,
        validity_date: validityDate || undefined,
        note: notes || undefined,
        order_line: lines
          .filter((l) => l.productId && l.quantity > 0)
          .map((l) => ({
            product_id: l.productId!,
            name: l.description,
            product_uom_qty: l.quantity,
            price_unit: l.unitPrice,
            discount: l.discount,
          })),
      });
      router.push(`/quotations/${orderId}`);
    } catch (err) {
      alert(`Failed to create quotation: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/quotations" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
          New Quotation
        </h1>
      </div>

<Card>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <Input
              id="customer-search"
              label="Customer"
              value={customerQuery || (customers.find((c) => c.id === partnerId)?.name ?? "")}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setPartnerId(0);
              }}
              placeholder="Search customers..."
            />
            {customerQuery && customerSuggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-white">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setPartnerId(c.id);
                      setCustomerQuery(c.name);
                      setCustomerSuggestions([]);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-border-light)]"
                  >
                    <div className="font-medium text-[var(--color-text)]">{c.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{c.email || c.phone || c.city}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Input
            label="Valid Until"
            type="date"
            value={validityDate}
            onChange={(e) => setValidityDate(e.target.value)}
          />
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
            Line Items
          </h2>
          <Button variant="outline" size="sm" onClick={addLine}>
            <Plus size={14} />
            Add Line
          </Button>
        </div>

        {lines.map((line) => {
          const pq = productQueries[line.id] ?? "";
          const lower = pq.toLowerCase();
          const productMatches = pq
            ? products.filter((p) =>
                p.name.toLowerCase().includes(lower) ||
                (p.default_code && p.default_code.toLowerCase().includes(lower))
              ).slice(0, 50)
            : [];

          return (
          <Card key={line.id} padding="sm" className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="col-span-3 flex flex-col gap-1.5 relative">
                  <Input
                    id={`product-${line.id}`}
                    label="Product"
                    value={pq || line.productLabel || ""}
                    onChange={(e) => setProductQueries((prev) => ({ ...prev, [line.id]: e.target.value }))}
                    placeholder="Select product..."
                  />
                  {productMatches.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-white">
                      {productMatches.map((p) => (
                        <button
                          key={p.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectProduct(line.id, p.id);
                            setProductQueries((prev) => ({ ...prev, [line.id]: "" }));
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-border-light)]"
                        >
                          {p.default_code ? `${p.default_code} - ` : ""}{p.name} (TZS {p.list_price.toLocaleString()})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <Input
                    label="Description"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, "description", e.target.value)}
                  />
                </div>
                <Input
                  label="Quantity"
                  type="number"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, "quantity", Number(e.target.value))}
                  min={0}
                />
                <Input
                  label="Rate (TZS)"
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.id, "unitPrice", Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
                <Input
                  label="Discount %"
                  type="number"
                  value={line.discount}
                  onChange={(e) => updateLine(line.id, "discount", Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
              <button
                onClick={() => removeLine(line.id)}
                className="ml-3 mt-7 rounded-lg p-2 text-[var(--color-text-light)] hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="text-right text-sm font-semibold font-[family-name:var(--font-heading)]">
              Subtotal: {formatCurrency(line.subtotal)}
            </div>
          </Card>
          )
        })}

        {lines.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-[var(--color-border)] py-12 text-center text-[var(--color-text-muted)]">
            No line items yet. Click &ldquo;Add Line&rdquo; to get started.
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <Card>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">Tax (18% VAT)</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
              <span className="font-bold text-[var(--color-primary)]">Total</span>
              <span className="text-lg font-bold font-[family-name:var(--font-heading)] text-[var(--color-primary)]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </Card>
      )}

      <div>
        <label className="text-sm font-medium text-[var(--color-text)]">Terms & Conditions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          placeholder="Payment terms, delivery conditions, etc."
        />
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/quotations">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Create Quotation"}
        </Button>
      </div>
    </div>
  );
}
