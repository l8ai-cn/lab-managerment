import type { ReactNode } from "react";
import { ContentCard } from "./ContentCard";

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  trend?: string;
}

/**
 * Brand-new written StatCard (Batch 1 Core Primitive)
 * 100% Free of Ant Design Statistic, uses custom Geist typography metric values.
 */
export function StatCard({ title, value, suffix, icon, color = "var(--brand)", trend }: StatCardProps) {
  return (
    <ContentCard className="relative overflow-hidden transition-all group hover:border-[var(--border-strong)]">
      <div className="flex items-start gap-4">
        {icon && (
          <div 
            className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] shrink-0 transition-colors"
            style={{ 
              backgroundColor: `${color}12`, 
              color: color 
            }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="block text-xs font-medium text-[var(--ink-secondary)] truncate">{title}</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span 
              className="text-[var(--text-metric)] font-semibold tracking-tight text-[var(--ink-primary)] font-mono tracking-tight tabular-nums truncate block"
              style={{ color }}
            >
              {value}
            </span>
            {suffix && (
              <span className="text-xs font-medium text-[var(--ink-secondary)]">{suffix}</span>
            )}
          </div>
          {trend && (
            <div className="text-xs text-[var(--ink-tertiary)] font-medium mt-1 truncate">
              {trend}
            </div>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
export default StatCard;
