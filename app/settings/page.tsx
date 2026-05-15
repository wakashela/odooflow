"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import {
  fetchAllSettings,
  writeCompanySettings,
  writeCompanyLogo,
  writeBankDetail,
  createBankDetail,
  deleteBankDetail,
  writePdfColors,
  writePrintSettings,
} from "@/lib/odoo/settings";
import type { CompanySettings, BankDetail, PdfColorSettings, PrintSettings } from "@/types/settings";
import {
  Building2,
  Landmark,
  Palette,
  Save,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  FileText,
  Printer,
} from "lucide-react";

type Tab = "company" | "bank" | "pdf" | "print";

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: "company", label: "Company Details", icon: Building2 },
  { key: "bank", label: "Bank Details", icon: Landmark },
  { key: "pdf", label: "PDF Colors", icon: Palette },
  { key: "print", label: "Print Settings", icon: Printer },
];

export default function SettingsPage() {
  const { session } = useAuthStore();
  const { company, pdfColors, printSettings, loading, setCompany, setBanks, setPdfColors, setPrintSettings, setLoading } =
    useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>("company");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local edit state
  const [companyForm, setCompanyForm] = useState<Partial<CompanySettings>>({});
  const [bankForms, setBankForms] = useState<BankDetail[]>([]);
  const [colorForm, setColorForm] = useState<PdfColorSettings>(pdfColors);
  const [printForm, setPrintForm] = useState<PrintSettings>(printSettings);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllSettings();
      setCompany(data.company);
      setBanks(data.banks);
      setPdfColors(data.pdfColors);
      setPrintSettings(data.printSettings);
      setCompanyForm(data.company || {});
      setBankForms(data.banks.length > 0 ? data.banks : [emptyBank()]);
      setColorForm(data.pdfColors);
      setPrintForm(data.printSettings);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setCompany, setBanks, setPdfColors, setPrintSettings, setLoading]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session) loadSettings();
  }, [session, loadSettings]);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // --- Company handlers ---
  const handleCompanySave = async () => {
    if (!company?.id) return;
    setSaving(true);
    setError(null);
    try {
      await writeCompanySettings(company.id, {
        name: companyForm.name,
        street: companyForm.street,
        street2: companyForm.street2,
        city: companyForm.city,
        zip: companyForm.zip,
        phone: companyForm.phone,
        email: companyForm.email,
        website: companyForm.website,
        vat: companyForm.vat,
      });
      setCompany({ ...company, ...companyForm } as CompanySettings);
      showSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;
    setSaving(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await writeCompanyLogo(company.id, base64);
        setCompany({ ...company, logo: base64 });
        setCompanyForm({ ...companyForm, logo: base64 });
        setSaving(false);
        showSaved();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  // --- Bank handlers ---
  const handleBankSave = async () => {
    if (!company?.partner_id) return;
    setSaving(true);
    setError(null);
    try {
      const updated: BankDetail[] = [];
      for (const bf of bankForms) {
        if (bf.id > 0) {
          await writeBankDetail(bf.id, {
            bank_name: bf.bank_name,
            acc_number: bf.acc_number,
            acc_holder_name: bf.acc_holder_name,
            bank_bic: bf.bank_bic,
            x_tzs_account: bf.x_tzs_account,
            x_usd_account: bf.x_usd_account,
            x_branch: bf.x_branch,
            x_sort_code: bf.x_sort_code,
          });
          updated.push(bf);
        } else {
          const newId = await createBankDetail(company.partner_id, {
            bank_name: bf.bank_name,
            acc_number: bf.acc_number,
            acc_holder_name: bf.acc_holder_name,
            bank_bic: bf.bank_bic,
            x_tzs_account: bf.x_tzs_account,
            x_usd_account: bf.x_usd_account,
            x_branch: bf.x_branch,
            x_sort_code: bf.x_sort_code,
          });
          updated.push({ ...bf, id: newId });
        }
      }
      setBanks(updated);
      setBankForms(updated);
      showSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBank = async (bankId: number, index: number) => {
    if (bankId > 0) {
      setSaving(true);
      try {
        await deleteBankDetail(bankId);
        const updated = bankForms.filter((_, i) => i !== index);
        setBankForms(updated.length > 0 ? updated : [emptyBank()]);
        setBanks(updated);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setSaving(false);
      }
    } else {
      const updated = bankForms.filter((_, i) => i !== index);
      setBankForms(updated.length > 0 ? updated : [emptyBank()]);
    }
  };

  const addBankEntry = () => {
    setBankForms([...bankForms, emptyBank()]);
  };

  // --- PDF Color handlers ---
  const handleColorSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await writePdfColors(colorForm);
      setPdfColors(colorForm);
      showSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // --- Print Settings handlers ---
  const handlePrintSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await writePrintSettings(printForm);
      setPrintSettings(printForm);
      showSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // --- PDF Preview ---
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/pdf/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colors: colorForm, company: companyForm, bank: bankForms[0] }),
      });
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
    } finally {
      setPreviewLoading(false);
    }
  }, [colorForm, companyForm, bankForms]);

  useEffect(() => {
    if (activeTab !== "pdf") return;
    if (loading) return;
    const timer = setTimeout(() => generatePreview(), 600);
    return () => clearTimeout(timer);
  }, [activeTab, loading, generatePreview]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">Settings</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Manage company details, bank information, and PDF appearance
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Saved banner */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} /> Settings saved successfully
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-hairline)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {activeTab === "company" && (
            <CompanyTab
              form={companyForm}
              onChange={setCompanyForm}
              onSave={handleCompanySave}
              saving={saving}
              onLogoUpload={handleLogoUpload}
              fileInputRef={fileInputRef}
            />
          )}
          {activeTab === "bank" && (
            <BankTab
              forms={bankForms}
              onChange={setBankForms}
              onSave={handleBankSave}
              saving={saving}
              onAdd={addBankEntry}
              onDelete={handleDeleteBank}
            />
          )}
          {activeTab === "pdf" && (
            <PdfColorTab
              form={colorForm}
              onChange={setColorForm}
              onSave={handleColorSave}
              saving={saving}
            />
          )}
          {activeTab === "print" && (
            <PrintSettingsTab
              form={printForm}
              onChange={setPrintForm}
              onSave={handlePrintSave}
              saving={saving}
            />
          )}
        </div>

        {/* PDF Preview (only on PDF tab) */}
        {activeTab === "pdf" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
              <FileText size={16} />
              Live Preview
            </div>
            <div className="border border-[var(--color-hairline)] rounded-lg overflow-hidden bg-[var(--color-surface-soft)]">
              {previewLoading && (
                <div className="flex items-center justify-center h-[600px]">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-muted)]" />
                </div>
              )}
              {previewUrl && !previewLoading && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[600px] border-0"
                  title="PDF Preview"
                />
              )}
              {!previewUrl && !previewLoading && (
                <div className="flex items-center justify-center h-[600px] text-[var(--color-muted-soft)] text-sm">
                  Preview will appear here
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function CompanyTab({
  form,
  onChange,
  onSave,
  saving,
  onLogoUpload,
  fileInputRef,
}: {
  form: Partial<CompanySettings>;
  onChange: (f: Partial<CompanySettings>) => void;
  onSave: () => void;
  saving: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const set = (key: keyof CompanySettings, value: string) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="space-y-5">
      {/* Logo */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-ink)]">Company Logo</label>
        <div className="flex items-center gap-4">
          {form.logo ? (
            <img
              src={`data:image/png;base64,${form.logo}`}
              alt="Logo"
              className="h-16 w-auto object-contain border border-[var(--color-hairline)] rounded-lg p-1"
            />
          ) : (
            <div className="h-16 w-24 border-2 border-dashed border-[var(--color-hairline)] rounded-lg flex items-center justify-center text-[var(--color-muted-soft)] text-xs">
              No logo
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--color-hairline)] rounded-lg hover:bg-[var(--color-surface-soft)] transition-colors"
            >
              <Upload size={14} /> Upload Logo
            </button>
          </div>
        </div>
      </div>

      <InputField label="Company Name" value={form.name || ""} onChange={(v) => set("name", v)} />
      <InputField label="VAT / TIN" value={form.vat || ""} onChange={(v) => set("vat", v)} />
      <InputField label="Street" value={form.street || ""} onChange={(v) => set("street", v)} />
      <InputField label="Street 2" value={form.street2 || ""} onChange={(v) => set("street2", v)} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="City" value={form.city || ""} onChange={(v) => set("city", v)} />
        <InputField label="Zip / Postal" value={form.zip || ""} onChange={(v) => set("zip", v)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Phone" value={form.phone || ""} onChange={(v) => set("phone", v)} />
        <InputField label="Email" value={form.email || ""} onChange={(v) => set("email", v)} />
      </div>
      <InputField label="Website" value={form.website || ""} onChange={(v) => set("website", v)} />

      <SaveButton onClick={onSave} saving={saving} />
    </div>
  );
}

function BankTab({
  forms,
  onChange,
  onSave,
  saving,
  onAdd,
  onDelete,
}: {
  forms: BankDetail[];
  onChange: (f: BankDetail[]) => void;
  onSave: () => void;
  saving: boolean;
  onAdd: () => void;
  onDelete: (id: number, index: number) => void;
}) {
  const updateBank = (index: number, key: keyof BankDetail, value: string) => {
    const updated = [...forms];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {forms.map((bank, idx) => (
        <div key={bank.id || idx} className="space-y-4 p-4 border border-[var(--color-hairline)] rounded-lg relative">
          {forms.length > 1 && (
            <button
              onClick={() => onDelete(bank.id, idx)}
              className="absolute top-3 right-3 text-[var(--color-muted-soft)] hover:text-[var(--color-error)] transition-colors"
              title="Remove bank"
            >
              <Trash2 size={16} />
            </button>
          )}
          <InputField
            label="Bank Name"
            value={bank.bank_name}
            onChange={(v) => updateBank(idx, "bank_name", v)}
          />
          <InputField
            label="Beneficiary Name"
            value={bank.acc_holder_name}
            onChange={(v) => updateBank(idx, "acc_holder_name", v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="TZS Account"
              value={bank.x_tzs_account}
              onChange={(v) => updateBank(idx, "x_tzs_account", v)}
            />
            <InputField
              label="USD Account"
              value={bank.x_usd_account}
              onChange={(v) => updateBank(idx, "x_usd_account", v)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField
              label="SWIFT / BIC"
              value={bank.bank_bic}
              onChange={(v) => updateBank(idx, "bank_bic", v)}
            />
            <InputField
              label="Branch"
              value={bank.x_branch}
              onChange={(v) => updateBank(idx, "x_branch", v)}
            />
            <InputField
              label="Sort Code"
              value={bank.x_sort_code}
              onChange={(v) => updateBank(idx, "x_sort_code", v)}
            />
          </div>
        </div>
      ))}

      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-primary)] border border-dashed border-[var(--color-primary)] rounded-lg hover:bg-[var(--color-surface-soft)] transition-colors"
      >
        <Plus size={16} /> Add Bank
      </button>

      <SaveButton onClick={onSave} saving={saving} />
    </div>
  );
}

function PdfColorTab({
  form,
  onChange,
  onSave,
  saving,
}: {
  form: PdfColorSettings;
  onChange: (f: PdfColorSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-5">
      <ColorField
        label="Primary Color"
        description="Table headers, totals bar, badges"
        value={form.primary}
        onChange={(v) => onChange({ ...form, primary: v })}
      />
      <ColorField
        label="Primary Dark"
        description="Copy banner (original), accents"
        value={form.primaryDark}
        onChange={(v) => onChange({ ...form, primaryDark: v })}
      />
      <ColorField
        label="Accent Color"
        description="Highlights, proforma banner"
        value={form.accent}
        onChange={(v) => onChange({ ...form, accent: v })}
      />
      <SaveButton onClick={onSave} saving={saving} />
    </div>
  );
}

function PrintSettingsTab({
  form,
  onChange,
  onSave,
  saving,
}: {
  form: PrintSettings;
  onChange: (f: PrintSettings) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-[var(--color-ink)]">Print Original & Duplicate</label>
            <p className="text-xs text-[var(--color-muted-soft)] mt-0.5">
              When enabled, PDF documents will be printed with &quot;ORIGINAL&quot; and &quot;DUPLICATE&quot; banners
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...form, enableOriginalDuplicate: !form.enableOriginalDuplicate })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enableOriginalDuplicate ? "bg-[var(--color-primary)]" : "bg-[var(--color-hairline)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.enableOriginalDuplicate ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-[var(--color-ink)]">Show Delivery Time in Line Items</label>
            <p className="text-xs text-[var(--color-muted-soft)] mt-0.5">
              Display delivery time column in line items tables and PDF documents
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...form, showDeliveryTimeInLine: !form.showDeliveryTimeInLine })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.showDeliveryTimeInLine ? "bg-[var(--color-primary)]" : "bg-[var(--color-hairline)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                form.showDeliveryTimeInLine ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-8 flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Print Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared UI ─── */

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[var(--color-ink)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[var(--color-hairline)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow"
      />
    </div>
  );
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-ink)]">{label}</label>
        <span className="text-xs text-[var(--color-muted-soft)]">{description}</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 rounded-lg border border-[var(--color-hairline)] cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-[var(--color-hairline)] rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        />
      </div>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
}: {
  onClick: () => void;
  saving: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary-active)] disabled:opacity-50 transition-colors"
    >
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {saving ? "Saving..." : "Save Changes"}
    </button>
  );
}

function emptyBank(): BankDetail {
  return {
    id: 0,
    bank_name: "",
    acc_number: "",
    acc_holder_name: "",
    bank_bic: "",
    x_tzs_account: "",
    x_usd_account: "",
    x_branch: "",
    x_sort_code: "",
  };
}
