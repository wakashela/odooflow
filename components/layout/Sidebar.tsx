"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText,
  FileCheck,
  ShoppingCart,
  Receipt,
  Truck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import type { DocumentType } from "@/types/documents";

const NAV_ITEMS: { type: DocumentType | "dashboard"; label: string; href: string; icon: React.ElementType }[] = [
  { type: "dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard },
  { type: "quotation", label: "Quotations", href: "/quotations", icon: FileText },
  { type: "proforma", label: "Proforma", href: "/proforma", icon: FileCheck },
  { type: "purchase_order", label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { type: "invoice", label: "Tax Invoices", href: "/invoices", icon: Receipt },
  { type: "delivery", label: "Delivery Notes", href: "/delivery", icon: Truck },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--color-border)] bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white font-bold text-sm font-[family-name:var(--font-heading)]">
          JI
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)]">
              OdooFlow
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Jensen International
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
        const isActive =
          item.type === "dashboard"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.type}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-text)]"
              )}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-[var(--color-border)] py-3 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
