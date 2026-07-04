import { useQuery } from "@tanstack/react-query";
import { Badge, Card, Col, Descriptions, Row, Select, Spin, Table, Tag } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { api } from "@/shared/api/client";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { USAGE_TYPE_LABELS } from "@/features/lab-bookings/api/labBookingsApi";

interface ClassBoardDevice {
  id: string;
  device_code: string;
  name: string;
  lab_id?: string;
  location?: string;
  is_online: boolean;
}

interface ClassBoardDisplay {
  device_id: string;
  device_name: string;
  lab_id?: string;
  lab_name?: string;
  lab_open_status?: string;
  inspection_status?: string;
  current_status: string;
  updated_at: string;
  today_bookings: Array<{
    start_time: string;
    end_time: string;
    usage_type: string;
    purpose: string;
    status: string;
  }>;
}

const accessControlApi = {
  listClassBoards: () =>
    api.get<ClassBoardDevice[]>("/access-control/class-boards").then((r) => r.data),
  getDisplay: (deviceId: string) =>
    api.get<ClassBoardDisplay>(`/access-control/class-boards/${deviceId}/display`).then((r) => r.data),
};

export function ClassBoardPage() {
  const [deviceId, setDeviceId] = useState<string>();

  const { data: devices } = useQuery({
    queryKey: ["class-boards"],
    queryFn: accessControlApi.listClassBoards,
  });

  const { data: display, isLoading } = useQuery({
    queryKey: ["class-board-display", deviceId],
    queryFn: () => accessControlApi.getDisplay(deviceId!),
    enabled: !!deviceId,
    refetchInterval: 30_000,
  });

  const deviceOptions = devices?.map((d) => ({ value: d.id, label: `${d.device_code} ${d.name}` })) ?? [];

  return (
    <>
      <PageHeader subtitle="电子班牌模拟展示 — 预约/课程/使用状态" />

      <ContentCard>
        <Select
          placeholder="选择班牌设备"
          options={deviceOptions}
          style={{ width: 360, marginBottom: 24 }}
          value={deviceId}
          onChange={setDeviceId}
        />

        {!deviceId ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>请选择班牌设备查看展示内容</div>
        ) : isLoading ? (
          <Spin style={{ display: "block", margin: "48px auto" }} />
        ) : display ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Card title="班牌状态面板" style={{ background: "#0f172a", color: "#f8fafc" }}>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{display.lab_name ?? display.device_name}</div>
                <Tag color={display.current_status === "使用中" ? "red" : "green"} style={{ fontSize: 16, padding: "4px 12px" }}>
                  {display.current_status}
                </Tag>
                <Descriptions column={1} size="small" style={{ marginTop: 16, color: "#cbd5e1" }}>
                  <Descriptions.Item label="开放状态">{display.lab_open_status ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="巡查状态">{display.inspection_status ?? "-"}</Descriptions.Item>
                  <Descriptions.Item label="刷新时间">{dayjs(display.updated_at).format("HH:mm:ss")}</Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} lg={14}>
              <Card title="今日预约安排">
                <Table
                  size="small"
                  rowKey={(r) => `${r.start_time}-${r.purpose}`}
                  pagination={false}
                  dataSource={display.today_bookings}
                  columns={[
                    {
                      title: "时段",
                      key: "time",
                      render: (_, r) =>
                        `${dayjs(r.start_time).format("HH:mm")} - ${dayjs(r.end_time).format("HH:mm")}`,
                    },
                    {
                      title: "类型",
                      dataIndex: "usage_type",
                      render: (v: string) => USAGE_TYPE_LABELS[v as keyof typeof USAGE_TYPE_LABELS] ?? v,
                    },
                    { title: "用途", dataIndex: "purpose", ellipsis: true },
                    {
                      title: "状态",
                      dataIndex: "status",
                      render: (s: string) => <Badge status={s === "approved" ? "success" : "processing"} text={s} />,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        ) : null}
      </ContentCard>
    </>
  );
}
