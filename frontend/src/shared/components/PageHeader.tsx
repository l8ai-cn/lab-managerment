import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getRouteMeta } from "@/shared/layout/routeMeta";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  breadcrumb?: { title: string; path?: string }[];
}

/**
 * Brand-new written PageHeader (Batch 1 Core Primitive)
 * 100% Free of Ant Design Breadcrumb and Typography.Title.
 * Strictly layout optimized per specs, Geist font scales and secondary ink opacity.
 */
export function PageHeader({ title, subtitle, extra, breadcrumb }: PageHeaderProps) {
  const { pathname } = useLocation();
  const meta = getRouteMeta(pathname);

  const crumbs = breadcrumb ?? [
    ...(meta.group ? [{ title: meta.group }] : []),
    { title: title ?? meta.title },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 w-full border-b border-[var(--border-subtle)] bg-[var(--canvas)] animate-fade-in select-none">
      <div className="flex flex-col gap-1">
        {/* Breadcrumbs using strictly custom chevron separator (Cal.com / Linear style) */}
        <nav className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-tertiary)] font-medium">
          {crumbs.map((crumb, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3 h-3 text-[var(--ink-muted)] shrink-0" />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-[var(--brand)] transition-colors">
                  {crumb.title}
                </Link>
              ) : (
                <span className="truncate max-w-[200px] text-[var(--ink-secondary)]">{crumb.title}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Title & Subtitle with hierarchy tokens */}
        <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-[var(--ink-primary)] mt-1.5">
          {title ?? meta.title}
        </h1>
        
        {(subtitle ?? meta.subtitle) && (
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed max-w-2xl mt-0.5">
            {subtitle ?? meta.subtitle}
          </p>
        )}
      </div>

      {/* Primary Actions Area */}
      {extra && (
        <div className="flex items-center gap-2.5 shrink-0">
          {extra}
        </div>
      )}
    </div>
  );
}
export default PageHeader;
