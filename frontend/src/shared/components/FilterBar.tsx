import React from "react";
import { ContentCard } from "./ContentCard";

interface FilterBarProps {
  children: React.ReactNode;
}

/**
 * Brand-new written FilterBar (Batch 1 Core Primitive)
 * 100% Free of Ant Design Space, uses pure flex wrapping with high performance and CSS custom spacing tokens.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <ContentCard className="border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-center gap-3 w-full">
        {children}
      </div>
    </ContentCard>
  );
}
export default FilterBar;
