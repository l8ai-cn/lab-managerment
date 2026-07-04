import {
  BookOutlined,
  CalendarOutlined,
  ExperimentOutlined,
  HomeOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Col, Row, Table } from "antd";
import { USAGE_TYPE_LABELS } from "@/features/lab-bookings/api/labBookingsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { statisticsApi } from "../api/statisticsApi";

function dictToTableData(dict: Record<string, number>, keyLabel: string) {
  return Object.entries(dict).map(([key, count]) => ({ key, count, [keyLabel]: key }));
}

export function StatisticsPage() {
  const { data: overview } = useQuery({
    queryKey: ["statistics-overview"],
    queryFn: statisticsApi.overview,
  });

  const { data: instrumentUsage } = useQuery({
    queryKey: ["statistics-instrument-usage"],
    queryFn: statisticsApi.instrumentUsage,
  });

  const { data: labUsage } = useQuery({
    queryKey: ["statistics-lab-usage"],
    queryFn: statisticsApi.labUsage,
  });

  const usageTypeData = labUsage
    ? Object.entries(labUsage.by_usage_type).map(([type, count]) => ({
        type,
        label: USAGE_TYPE_LABELS[type as keyof typeof USAGE_TYPE_LABELS] ?? type,
        count,
      }))
    : [];

  const totalLabBookings = labUsage
    ? Object.values(labUsage.by_usage_type).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <>
      <PageHeader />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard title="实验室总数" value={overview?.lab_count ?? 0} icon={<HomeOutlined />} color="#0ea5e9" />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard title="仪器总数" value={overview?.instrument_count ?? 0} icon={<ToolOutlined />} color="#8b5cf6" />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard title="仪器预约" value={overview?.booking_count ?? 0} icon={<CalendarOutlined />} color="#f59e0b" />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard title="实验室预约" value={overview?.lab_booking_count ?? 0} icon={<BookOutlined />} color="#10b981" />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard title="故障总数" value={overview?.fault_count ?? 0} icon={<WarningOutlined />} color="#ef4444" />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <StatCard
            title="待处理预约"
            value={overview?.pending_bookings ?? 0}
            icon={<ExperimentOutlined />}
            color="#f97316"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ContentCard title="仪器使用（按实验室）">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={dictToTableData(instrumentUsage?.by_lab ?? {}, "lab")}
              columns={[
                { title: "实验室", dataIndex: "lab" },
                { title: "使用次数", dataIndex: "count", width: 100 },
              ]}
            />
          </ContentCard>
        </Col>
        <Col xs={24} lg={12}>
          <ContentCard title="实验室使用类型分布">
            <Table
              size="small"
              rowKey="type"
              pagination={false}
              dataSource={usageTypeData}
              columns={[
                { title: "使用类型", dataIndex: "label" },
                { title: "预约数", dataIndex: "count", width: 100 },
              ]}
            />
          </ContentCard>
        </Col>
        <Col xs={24}>
          <ContentCard title="实验室使用统计">
            <Row gutter={16}>
              <Col span={8}>
                <StatCard title="总预约数" value={totalLabBookings} color="#0ea5e9" />
              </Col>
              <Col span={8}>
                <StatCard title="总使用时长(h)" value={labUsage?.total_hours ?? 0} color="#10b981" />
              </Col>
              <Col span={8}>
                <StatCard title="总人时数" value={labUsage?.person_times ?? 0} color="#8b5cf6" />
              </Col>
            </Row>
          </ContentCard>
        </Col>
      </Row>
    </>
  );
}
