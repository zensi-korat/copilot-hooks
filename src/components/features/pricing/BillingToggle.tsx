"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

export function BillingToggle({ isAnnual, onToggle }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          !isAnnual ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isAnnual ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform",
            isAnnual ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      <span
        className={cn(
          "text-sm font-medium transition-colors",
          isAnnual ? "text-foreground" : "text-muted-foreground"
        )}
      >
        Annual
      </span>
      {isAnnual && (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          Save 20%
        </span>
      )}
    </div>
  );
}
