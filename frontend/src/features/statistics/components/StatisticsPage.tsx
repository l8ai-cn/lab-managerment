import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Statistic, Table } from "antd";
import { USAGE_TYPE_LABELS } from "@/features/lab-bookings/api/labBookingsApi";
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

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="实验室总数" value={overview?.lab_count ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="仪器总数" value={overview?.instrument_count ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="仪器预约数" value={overview?.booking_count ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="实验室预约数" value={overview?.lab_booking_count ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="故障总数" value={overview?.fault_count ?? 0} /></Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理预约"
              value={overview?.pending_bookings ?? 0}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理故障"
              value={overview?.pending_faults ?? 0}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="实验室使用时长(h)" value={labUsage?.total_hours ?? 0} precision={1} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={`仪器预约统计（共 ${instrumentUsage?.total_bookings ?? 0} 次）`}>
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={dictToTableData(instrumentUsage?.by_category ?? {}, "category")}
              columns={[
                { title: "仪器分类", dataIndex: "category" },
                { title: "预约次数", dataIndex: "count", width: 100 },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="实验室用途分布">
            <Table
              size="small"
              rowKey="type"
              pagination={false}
              dataSource={usageTypeData}
              columns={[
                { title: "用途类型", dataIndex: "label" },
                { title: "预约次数", dataIndex: "count", width: 100 },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="仪器按实验室分布">
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={dictToTableData(instrumentUsage?.by_lab ?? {}, "lab")}
              columns={[
                { title: "实验室", dataIndex: "lab" },
                { title: "预约次数", dataIndex: "count", width: 100 },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="实验室使用概况">
            <Statistic title="总人次" value={labUsage?.person_times ?? 0} style={{ marginBottom: 16 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
