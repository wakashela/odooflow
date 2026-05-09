"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { logout } from "@/lib/odoo/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  Users,
  LogOut,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Proforma", href: "/proforma", icon: FileSignature },
  { label: "Purchases", href: "/purchase-orders", icon: ShoppingCart },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Delivery", href: "/delivery", icon: Truck },
  { label: "Packing List", href: "/packing-lists", icon: ClipboardList },
  { label: "Products", href: "/products", icon: Package },
  { label: "Customers", href: "/customers", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, reset } = useAuthStore();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    reset();
    router.replace("/login");
  };

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col bg-white border-r border-[var(--color-hairline)] shadow-sm h-screen sticky top-0 left-0 z-10 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[200px]"
      )}
    >
      {/* Logo Area */}
      <div className="h-[80px] flex items-center px-4">
        <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-xl">
          <Image
            src="/logo.png"
            alt="OdooFlow Logo"
            width={32}
            height={32}
            className="h-8 w-auto object-contain shrink-0"
            priority
          />
          {!collapsed && <span className="font-bold">OdooFlow</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-surface-soft)] text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={20}
                className={cn(
                  "shrink-0",
                  isActive ? "text-[var(--color-primary)]" : "text-inherit"
                )}
              />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area / User Info */}
      <div className="p-2 border-t border-[var(--color-hairline)] space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-soft)] text-[var(--color-ink)] flex items-center justify-center font-bold text-sm shrink-0">
              {session?.name ? session.name[0].toUpperCase() : "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[14px] font-semibold text-[var(--color-ink)] truncate">
                {session?.name || "User"}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-soft)] text-[var(--color-ink)] flex items-center justify-center font-bold text-sm">
              {session?.name ? session.name[0].toUpperCase() : "U"}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors rounded-lg group",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Log out" : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors shrink-0">
            <LogOut size={16} />
          </div>
          {!collapsed && "Log out"}
        </button>
        <button
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-[14px] font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors rounded-lg group",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors shrink-0">
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </div>
          {!collapsed && (collapsed ? "Expand" : "Fold")}
        </button>
      </div>
    </aside>
  );
}
