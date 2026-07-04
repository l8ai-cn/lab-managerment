import { Card } from "antd";
import type { CardProps } from "antd";

interface ContentCardProps extends CardProps {
  noPadding?: boolean;
}

export function ContentCard({ children, noPadding, styles, ...props }: ContentCardProps) {
  return (
    <Card
      bordered={false}
      styles={{
        body: noPadding ? { padding: 0 } : undefined,
        ...styles,
      }}
      {...props}
    >
      {children}
    </Card>
  );
}
