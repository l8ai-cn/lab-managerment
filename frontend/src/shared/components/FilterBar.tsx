import { Space } from "antd";
import { ContentCard } from "./ContentCard";
import "./FilterBar.css";

interface FilterBarProps {
  children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return (
    <ContentCard className="filter-bar" styles={{ body: { padding: "16px 20px" } }}>
      <Space wrap size={[12, 12]} className="filter-bar__inner">
        {children}
      </Space>
    </ContentCard>
  );
}
