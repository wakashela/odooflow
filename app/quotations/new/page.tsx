"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuotation } from "@/lib/odoo/sale";
import { fetchCustomers, fetchProducts, searchPartners, createCustomer, createProduct } from "@/lib/odoo/partner";
import { formatCurrency, computeLineAmount } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { ResPartner, ProductProduct } from "@/types/odoo";
import type { LineItem } from "@/types/documents";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

let nextLineId = -1;

export default function NewQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<ResPartner[]>([]);
  const [products, setProducts] = useState<ProductProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<ResPartner[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", street: "", city: "", vat: "", x_tin: "", is_company: true });

  const [productQueries, setProductQueries] = useState<Record<number, string>>({});
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalLineId, setProductModalLineId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    default_code: string;
    list_price: number;
    description: string;
    productType: "consu" | "service";
    saleOk: boolean;
    purchaseOk: boolean;
    standardPrice: number;
  }>({ name: "", default_code: "", list_price: 0, description: "", productType: "consu", saleOk: true, purchaseOk: true, standardPrice: 0 });

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
    setLines([newLine, ...lines]);
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

  function selectProductInLines(lineId: number, product: ProductProduct, currentLines: LineItem[]) {
    const updated = currentLines.map((l) => {
      if (l.id !== lineId) return l;
      const updatedLine = {
        ...l,
        productId: product.id,
        productLabel: product.default_code ? String(product.default_code) : product.name,
        description: `${product.default_code ? product.default_code + " - " : ""}${product.name}`,
        unitPrice: product.list_price,
      };
      updatedLine.subtotal = computeLineAmount(updatedLine.quantity, updatedLine.unitPrice, updatedLine.discount);
      return updatedLine;
    });
    setLines(updated);
  }

  function selectProduct(lineId: number, productId: number, productList?: typeof products) {
    const list = productList ?? products;
    const product = list.find((p) => p.id === productId);
    if (!product) return;
    setLines((currentLines) => {
      return currentLines.map((l) => {
        if (l.id !== lineId) return l;
        const updated = {
          ...l,
          productId: product.id,
          productLabel: product.default_code ? String(product.default_code) : product.name,
          description: `${product.default_code ? product.default_code + " - " : ""}${product.name}`,
          unitPrice: product.list_price,
        };
        updated.subtotal = computeLineAmount(updated.quantity, updated.unitPrice, updated.discount);
        return updated;
      });
    });
  }

  function removeLine(id: number) {
    setLines(lines.filter((l) => l.id !== id));
  }

  async function handleCreateCustomerForm() {
    try {
      setSavingCustomer(true);
      const newId = await createCustomer({ 
        name: customerForm.name,
        email: customerForm.email,
        phone: customerForm.phone,
        street: customerForm.street,
        city: customerForm.city,
        vat: customerForm.vat,
        is_company: customerForm.is_company,
        customer_rank: 1 
      });
      // Odoo create may return [id] or id depending on args format
      const customerId = Array.isArray(newId) ? newId[0] : newId;
      setPartnerId(customerId);
      setCustomerQuery(customerForm.name);
      setShowCustomerModal(false);
      const custs = await fetchCustomers();
      setCustomers(custs);
    } catch (err) {
      alert(`Failed to create customer: ${(err as Error).message}`);
    } finally {
      setSavingCustomer(false);
    }
  }

  async function handleCreateProductForm() {
    if (productModalLineId === null) return;
    if (!productForm.name.trim()) {
      alert("Please enter a product name");
      return;
    }
    try {
      setSavingProduct(true);
      const lineId = productModalLineId;
      const rawId = await createProduct({ 
        name: productForm.name,
        default_code: productForm.default_code,
        list_price: productForm.list_price,
        description_sale: productForm.description,
        type: productForm.productType, 
        sale_ok: productForm.saleOk,
        purchase_ok: productForm.purchaseOk,
        standard_price: productForm.standardPrice
      });
      // Odoo create may return [id] or id depending on args format
      const productId = Array.isArray(rawId) ? rawId[0] : rawId;
      
      // Update the line directly from form data — no lookup needed
      const label = productForm.default_code || productForm.name;
      const desc = `${productForm.default_code ? productForm.default_code + " - " : ""}${productForm.name}`;
      setLines((currentLines) => {
        return currentLines.map((l) => {
          if (l.id !== lineId) return l;
          const updated = {
            ...l,
            productId: productId,
            productLabel: label,
            description: desc,
            unitPrice: productForm.list_price,
          };
          updated.subtotal = computeLineAmount(updated.quantity, updated.unitPrice, updated.discount);
          return updated;
        });
      });
      // Clear product search query for this line so the label shows
      setProductQueries((prev) => ({ ...prev, [lineId]: "" }));

      // Refresh product list in background for future searches
      fetchProducts().then((prods) => setProducts(prods));

      setShowProductModal(false);
      setProductModalLineId(null);
    } catch (err) {
      alert(`Failed to create product: ${(err as Error).message}`);
    } finally {
      setSavingProduct(false);
    }
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
        partner_id: Array.isArray(partnerId) ? partnerId[0] : partnerId,
        validity_date: validityDate || undefined,
        note: notes || undefined,
        order_line: lines
          .filter((l) => l.productId && l.quantity > 0)
          .map((l) => ({
            product_id: Array.isArray(l.productId!) ? l.productId![0] : l.productId!,
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
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="w-full py-12 px-10 space-y-6">
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && customerQuery && partnerId === 0 && customerSuggestions.length === 0 && !customerSearching) {
                  e.preventDefault();
                  setCustomerForm({ name: customerQuery, email: "", phone: "", street: "", city: "", vat: "", x_tin: "", is_company: true });
                  setShowCustomerModal(true);
                  setCustomerSuggestions([]);
                }
              }}
              placeholder="Search customers..."
            />
            {customerQuery && customerSuggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 w-full max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-white">
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
            {customerQuery && partnerId === 0 && customerSuggestions.length === 0 && !customerSearching && (
              <div className="absolute z-50 top-full mt-1 left-0 w-full rounded-lg border border-[var(--color-border)] bg-white">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setCustomerForm({ name: customerQuery, email: "", phone: "", street: "", city: "", vat: "", x_tin: "", is_company: true });
                    setShowCustomerModal(true);
                    setCustomerSuggestions([]);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium"
                >
                  <Plus size={14} className="inline mr-1" />
                  Create &quot;{customerQuery}&quot; as new customer
                </button>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && pq && productMatches.length === 0) {
                        e.preventDefault();
                        setProductForm({ name: pq, default_code: "", list_price: 0, description: "", productType: "consu", saleOk: true, purchaseOk: true, standardPrice: 0 });
                        setProductModalLineId(line.id);
                        setShowProductModal(true);
                        setProductQueries((prev) => ({ ...prev, [line.id]: "" }));
                      }
                    }}
                    placeholder="Select product..."
                  />
                  {productMatches.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 w-full max-h-56 overflow-auto rounded-lg border border-[var(--color-border)] bg-white">
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
                  {pq && productMatches.length === 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 w-full rounded-lg border border-[var(--color-border)] bg-white">
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setProductForm({ name: pq, default_code: "", list_price: 0, description: "", productType: "consu", saleOk: true, purchaseOk: true, standardPrice: 0 });
                          setProductModalLineId(line.id);
                          setShowProductModal(true);
                          setProductQueries((prev) => ({ ...prev, [line.id]: "" }));
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium"
                      >
                        <Plus size={14} className="inline mr-1" />
                        Create &quot;{pq}&quot; as new product
                      </button>
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

      <Modal open={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="New Customer" className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Input label="Customer Name *" placeholder="e.g., Acme Corporation" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} />
          <Input label="Phone Number" placeholder="e.g., +255 712 345 678" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
          <Input label="Email Address" type="email" placeholder="e.g., contact@example.com" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
          <Input label="City" placeholder="e.g., Dar es Salaam" value={customerForm.city} onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })} />
          <Input label="Street Address" placeholder="e.g., 123 Main Street" value={customerForm.street} onChange={(e) => setCustomerForm({ ...customerForm, street: e.target.value })} />
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[14px] font-medium text-[var(--color-muted)]">Entity Type</span>
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)]">
              <span className="text-[16px] text-[var(--color-ink)]">Is a Company</span>
              <input
                type="checkbox"
                checked={customerForm.is_company}
                onChange={(e) => setCustomerForm({ ...customerForm, is_company: e.target.checked })}
                className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
              />
            </label>
          </div>
          <Input label="VRN" placeholder="e.g. 40-315066-K" value={customerForm.vat} onChange={(e) => setCustomerForm({ ...customerForm, vat: e.target.value })} />
          <Input label="TIN" placeholder="e.g. 168-782-179" value={customerForm.x_tin} onChange={(e) => setCustomerForm({ ...customerForm, x_tin: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-hairline)]">
          <Button variant="ghost" onClick={() => setShowCustomerModal(false)}>Cancel</Button>
          <Button onClick={handleCreateCustomerForm} disabled={savingCustomer}>
            {savingCustomer ? "Saving..." : "Create Customer"}
          </Button>
        </div>
      </Modal>

      <Modal open={showProductModal} onClose={() => setShowProductModal(false)} title="New Product" className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4">
            <Input label="Product Name *" placeholder="e.g., Laptop Pro 15" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            <Input label="SKU / Default Code" placeholder="e.g., LP-1500-BLK" value={productForm.default_code} onChange={(e) => setProductForm({ ...productForm, default_code: e.target.value })} />
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium text-[var(--color-muted)]">Product Type</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, productType: "consu" })}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    productForm.productType === "consu"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                  }`}
                >
                  Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductForm({ ...productForm, productType: "service" })}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    productForm.productType === "service"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                  }`}
                >
                  Service
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-medium text-[var(--color-muted)]">Description</span>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3.5 py-3 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-ink)] focus:border-2 focus:outline-none transition-colors resize-none"
                placeholder="Brief product description..."
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-[14px] font-medium text-[var(--color-muted)]">Availability Settings</span>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)]">
                <span className="text-[16px] text-[var(--color-ink)]">Available for Sale</span>
                <input
                  type="checkbox"
                  checked={productForm.saleOk}
                  onChange={(e) => setProductForm({ ...productForm, saleOk: e.target.checked })}
                  className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-hairline)] px-3.5 h-[56px] transition-colors hover:border-[var(--color-ink)] mt-2">
                <span className="text-[16px] text-[var(--color-ink)]">Available for Purchase</span>
                <input
                  type="checkbox"
                  checked={productForm.purchaseOk}
                  onChange={(e) => setProductForm({ ...productForm, purchaseOk: e.target.checked })}
                  className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
                />
              </label>
            </div>

            {productForm.saleOk && (
              <Input
                label="Sale Price (TZS)"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={productForm.list_price || ""}
                onChange={(e) => setProductForm({ ...productForm, list_price: Number(e.target.value) || 0 })}
              />
            )}

            {productForm.purchaseOk && (
              <Input
                label="Purchase Price (TZS)"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                value={productForm.standardPrice || ""}
                onChange={(e) => setProductForm({ ...productForm, standardPrice: Number(e.target.value) || 0 })}
              />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--color-hairline)]">
          <Button variant="ghost" onClick={() => setShowProductModal(false)} disabled={savingProduct}>Cancel</Button>
          <Button onClick={handleCreateProductForm} disabled={savingProduct}>
            {savingProduct ? "Saving..." : "Create Product"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
