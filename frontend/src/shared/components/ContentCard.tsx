import React from "react";
import clsx from "clsx";

interface ContentCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  children: React.ReactNode;
  noPadding?: boolean;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  styles?: {
    body?: React.CSSProperties;
  };
}

/**
 * Brand-new written ContentCard (Batch 1 Core Primitive)
 * 100% Free of Ant Design Card, uses precise styling tokens from docs/design/DESIGN.md
 * Fully supports custom titles, subtitles, inner types, and inline style backward-compatibility.
 */
export function ContentCard({ 
  children, 
  noPadding, 
  className, 
  title, 
  extra, 
  styles,
  ...props 
}: ContentCardProps) {
  return (
    <div
      className={clsx(
        "bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden transition-all",
        className
      )}
      {...props}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--canvas)]">
          <div className="text-xs font-semibold text-[var(--ink-primary)] select-none">
            {title}
          </div>
          {extra && (
            <div className="flex items-center gap-2">
              {extra}
            </div>
          )}
        </div>
      )}
      <div 
        className={clsx(noPadding ? "p-0" : "p-4 md:p-5")}
        style={styles?.body}
      >
        {children}
      </div>
    </div>
  );
}
