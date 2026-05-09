"use client";

import { formatCurrency, cn } from "@/lib/utils";
import type { LineItem } from "@/types/documents";

interface LineItemsTableProps {
  lines: LineItem[];
  editable?: boolean;
  onLineChange?: (id: number, field: keyof LineItem, value: number | string) => void;
  onLineDelete?: (id: number) => void;
  onLineAdd?: () => void;
}

export function LineItemsTable({
  lines,
  editable = false,
  onLineChange,
  onLineDelete,
  onLineAdd,
}: LineItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-primary)] text-white">
            <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-8">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-32">
              Part No
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-24">
              Qty
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-32">
              Rate
            </th>
            {editable && (
              <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-20">
                Disc %
              </th>
            )}
            <th className="px-4 py-3 text-right text-xs font-semibold font-[family-name:var(--font-heading)] uppercase tracking-wider w-36">
              Amount
            </th>
            {editable && (
              <th className="px-4 py-3 text-center w-12" />
            )}
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr
              key={line.id}
              className={cn(
                "border-b border-[var(--color-border-light)]",
                idx % 2 === 1 ? "bg-[var(--color-row-alt)]" : "bg-white"
              )}
            >
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{idx + 1}</td>
              <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs font-medium">
                {line.partNumber || "-"}
              </td>
              <td className="px-4 py-3">
                {editable ? (
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => onLineChange?.(line.id, "description", e.target.value)}
                    className="w-full rounded border border-[var(--color-border)] px-2 py-1 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                ) : (
                  <span className="text-[var(--color-text)]">{line.description}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {editable ? (
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => onLineChange?.(line.id, "quantity", Number(e.target.value))}
                    className="w-20 rounded border border-[var(--color-border)] px-2 py-1 text-sm text-right focus:border-[var(--color-primary)] focus:outline-none"
                    min={0}
                    step={1}
                  />
                ) : (
                  <span className="font-medium">{line.quantity}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-[family-name:var(--font-heading)]">
                {editable ? (
                  <input
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => onLineChange?.(line.id, "unitPrice", Number(e.target.value))}
                    className="w-28 rounded border border-[var(--color-border)] px-2 py-1 text-sm text-right focus:border-[var(--color-primary)] focus:outline-none"
                    min={0}
                    step={0.01}
                  />
                ) : (
                  <span>{formatCurrency(line.unitPrice)}</span>
                )}
              </td>
              {editable && (
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={line.discount}
                    onChange={(e) => onLineChange?.(line.id, "discount", Number(e.target.value))}
                    className="w-16 rounded border border-[var(--color-border)] px-2 py-1 text-sm text-right focus:border-[var(--color-primary)] focus:outline-none"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </td>
              )}
              <td className="px-4 py-3 text-right font-[family-name:var(--font-heading)] font-medium">
                {formatCurrency(line.subtotal)}
              </td>
              {editable && (
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onLineDelete?.(line.id)}
                    className="text-[var(--color-text-light)] hover:text-[var(--color-danger)] transition-colors"
                    title="Remove line"
                  >
                    &times;
                  </button>
                </td>
              )}
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={editable ? 8 : 6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                No line items
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {editable && onLineAdd && (
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            onClick={onLineAdd}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            + Add Line Item
          </button>
        </div>
      )}
    </div>
  );
}
