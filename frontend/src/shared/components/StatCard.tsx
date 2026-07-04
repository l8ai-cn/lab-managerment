import { Card, Statistic } from "antd";
import type { ReactNode } from "react";
import "./StatCard.css";

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  icon?: ReactNode;
  color?: string;
  trend?: string;
}

export function StatCard({ title, value, suffix, icon, color = "#0ea5e9", trend }: StatCardProps) {
  return (
    <Card bordered={false} className="stat-card">
      <div className="stat-card__inner">
        {icon && (
          <div className="stat-card__icon" style={{ background: `${color}15`, color }}>
            {icon}
          </div>
        )}
        <div className="stat-card__content">
          <Statistic
            title={<span className="stat-card__title">{title}</span>}
            value={value}
            suffix={suffix}
            valueStyle={{ color, fontSize: 28, fontWeight: 700 }}
          />
          {trend && <div className="stat-card__trend">{trend}</div>}
        </div>
      </div>
    </Card>
  );
}
