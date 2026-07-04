import { Breadcrumb, Typography } from "antd";
import { Link, useLocation } from "react-router-dom";
import { getRouteMeta } from "@/shared/layout/routeMeta";
import "./PageHeader.css";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  breadcrumb?: { title: string; path?: string }[];
}

export function PageHeader({ title, subtitle, extra, breadcrumb }: PageHeaderProps) {
  const { pathname } = useLocation();
  const meta = getRouteMeta(pathname);

  const crumbs = breadcrumb ?? [
    ...(meta.group ? [{ title: meta.group }] : []),
    { title: title ?? meta.title },
  ];

  return (
    <div className="page-header">
      <div className="page-header__main">
        <Breadcrumb
          items={crumbs.map((c) => ({
            title: c.path ? <Link to={c.path}>{c.title}</Link> : c.title,
          }))}
          className="page-header__breadcrumb"
        />
        <Typography.Title level={4} className="page-header__title">
          {title ?? meta.title}
        </Typography.Title>
        {(subtitle ?? meta.subtitle) && (
          <Typography.Text type="secondary" className="page-header__subtitle">
            {subtitle ?? meta.subtitle}
          </Typography.Text>
        )}
      </div>
      {extra && <div className="page-header__extra">{extra}</div>}
    </div>
  );
}
