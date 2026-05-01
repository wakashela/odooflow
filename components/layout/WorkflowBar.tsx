"use client";

import { cn } from "@/lib/utils";
import { WORKFLOW_ORDER, WORKFLOW_LABELS } from "@/types/documents";
import type { DocumentType, WorkflowStep } from "@/types/documents";
import { Check } from "lucide-react";

interface WorkflowBarProps {
  currentType: DocumentType;
  completed: DocumentType[];
}

export function WorkflowBar({ currentType, completed }: WorkflowBarProps) {
  const steps: WorkflowStep[] = WORKFLOW_ORDER.map((type) => ({
    type,
    label: WORKFLOW_LABELS[type],
    status: completed.includes(type)
      ? "completed"
      : type === currentType
        ? "current"
        : "pending",
  }));

  return (
    <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-white p-4">
      {steps.map((step, idx) => (
        <div key={step.type} className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold font-[family-name:var(--font-heading)] transition-colors",
                step.status === "completed" &&
                  "bg-[var(--color-primary)] text-white",
                step.status === "current" &&
                  "border-2 border-[var(--color-accent)] bg-white text-[var(--color-accent)]",
                step.status === "pending" &&
                  "border-2 border-[var(--color-border)] bg-white text-[var(--color-text-light)]"
              )}
            >
              {step.status === "completed" ? (
                <Check size={14} />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                step.status === "completed" && "text-[var(--color-primary)]",
                step.status === "current" && "text-[var(--color-accent)]",
                step.status === "pending" && "text-[var(--color-text-light)]"
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px w-8",
                step.status === "completed"
                  ? "bg-[var(--color-primary)]"
                  : "bg-[var(--color-border)]"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
