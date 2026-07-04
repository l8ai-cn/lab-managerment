import {
  BookOutlined,
  CalendarOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  HomeOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Col, DatePicker, Row, Segmented, Space, Table } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { USAGE_TYPE_LABELS } from "@/features/lab-bookings/api/labBookingsApi";
import {
  getDateRangeForPreset,
  TIME_PRESET_LABELS,
  type TimePreset,
} from "@/shared/utils/datePresets";
import {
  coursesApi,
  experimentProjectsApi,
  PROJECT_TYPE_LABELS,
} from "@/features/experiment-projects/api/experimentProjectsApi";
import { instrumentsApi } from "@/features/instruments/api/instrumentsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import { statisticsApi } from "../api/statisticsApi";

function dictToTableData(dict: Record<string, number>, keyLabel: string) {
  return Object.entries(dict).map(([key, count]) => ({ key, count, [keyLabel]: key }));
}

function exportCsv(filename: string, rows: string[][]) {
  const content = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function StatisticsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [preset, setPreset] = useState<TimePreset>("all");

  const handlePresetChange = (value: TimePreset) => {
    setPreset(value);
    setDateRange(getDateRangeForPreset(value));
  };

  const params = useMemo(() => {
    if (!dateRange) return {};
    return {
      from_time: dateRange[0].startOf("day").toISOString(),
      to_time: dateRange[1].endOf("day").toISOString(),
    };
  }, [dateRange]);

  const { data: overview } = useQuery({
    queryKey: ["statistics-overview"],
    queryFn: statisticsApi.overview,
  });

  const { data: instrumentUsage } = useQuery({
    queryKey: ["statistics-instrument-usage", params],
    queryFn: () => statisticsApi.instrumentUsage(params),
  });

  const { data: labUsage } = useQuery({
    queryKey: ["statistics-lab-usage", params],
    queryFn: () => statisticsApi.labUsage(params),
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ["statistics-instruments-value"],
    queryFn: () => instrumentsApi.list({ page_size: 500 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["statistics-projects"],
    queryFn: () => experimentProjectsApi.list({ page_size: 500 }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ["statistics-courses"],
    queryFn: () => coursesApi.list({ page_size: 500 }),
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

  const equipmentValue = useMemo(() => {
    const items = instrumentsData?.items ?? [];
    const total = items.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);
    const byCategory: Record<string, number> = {};
    for (const inst of items) {
      const cat = inst.category || "未分类";
      byCategory[cat] = (byCategory[cat] ?? 0) + (inst.purchase_price ?? 0);
    }
    return { total, byCategory, count: items.length };
  }, [instrumentsData]);

  const projectStats = useMemo(() => {
    const items = projectsData?.items ?? [];
    const byType: Record<string, number> = {};
    const bySemester: Record<string, number> = {};
    for (const p of items) {
      byType[p.type] = (byType[p.type] ?? 0) + 1;
      if (p.semester) bySemester[p.semester] = (bySemester[p.semester] ?? 0) + 1;
    }
    return {
      total: items.length,
      courses: coursesData?.total ?? 0,
      byType,
      bySemester,
    };
  }, [projectsData, coursesData]);

  const handleExportLabUsage = () => {
    exportCsv("lab_usage.csv", [
      ["使用类型", "预约数"],
      ...usageTypeData.map((r) => [r.label, String(r.count)]),
    ]);
  };

  const handleExportInstrumentUsage = () => {
    const rows = dictToTableData(instrumentUsage?.by_lab ?? {}, "lab");
    exportCsv("instrument_usage.csv", [
      ["实验室", "使用次数"],
      ...rows.map((r) => [r.lab as string, String(r.count)]),
    ]);
  };

  return (
    <>
      <PageHeader
        extra={
          <Space wrap>
            <Segmented
              options={Object.entries(TIME_PRESET_LABELS).map(([value, label]) => ({ value, label }))}
              value={preset}
              onChange={(v) => handlePresetChange(v as TimePreset)}
            />
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(v) => {
                setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null);
                setPreset("all");
              }}
            />
            <Button icon={<DownloadOutlined />} onClick={handleExportLabUsage}>
              导出实验室统计
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportInstrumentUsage}>
              导出仪器统计
            </Button>
          </Space>
        }
      />

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
        <Col xs={24} lg={12}>
          <ContentCard title="设备资产价值">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <StatCard
                  title="资产总值(元)"
                  value={equipmentValue.total.toLocaleString()}
                  color="#f59e0b"
                />
              </Col>
              <Col span={12}>
                <StatCard title="设备数量" value={equipmentValue.count} color="#6366f1" />
              </Col>
            </Row>
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={dictToTableData(equipmentValue.byCategory, "category")}
              columns={[
                { title: "分类", dataIndex: "category" },
                {
                  title: "价值(元)",
                  dataIndex: "count",
                  width: 120,
                  render: (v: number) => v.toLocaleString(),
                },
              ]}
            />
          </ContentCard>
        </Col>
        <Col xs={24} lg={12}>
          <ContentCard title="实验项目统计">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <StatCard title="实验项目数" value={projectStats.total} color="#0ea5e9" />
              </Col>
              <Col span={12}>
                <StatCard title="关联课程数" value={projectStats.courses} color="#10b981" />
              </Col>
            </Row>
            <Table
              size="small"
              rowKey="key"
              pagination={false}
              dataSource={Object.entries(projectStats.byType).map(([type, count]) => ({
                key: type,
                type,
                label: PROJECT_TYPE_LABELS[type as keyof typeof PROJECT_TYPE_LABELS] ?? type,
                count,
              }))}
              columns={[
                { title: "项目类型", dataIndex: "label" },
                { title: "数量", dataIndex: "count", width: 80 },
              ]}
            />
          </ContentCard>
        </Col>
      </Row>
    </>
  );
}
