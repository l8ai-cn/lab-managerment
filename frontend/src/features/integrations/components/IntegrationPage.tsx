import { SyncOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  INTEGRATION_TYPE_LABELS,
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
  integrationsApi,
  type IntegrationType,
  type SyncStatus,
} from "../api/integrationsApi";

const INTEGRATION_TYPES: IntegrationType[] = ["asset", "card", "access", "face", "payment"];

export function IntegrationPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["integration-status"],
    queryFn: integrationsApi.getStatus,
  });

  const syncMutation = useMutation({
    mutationFn: integrationsApi.triggerSync,
    onSuccess: (result) => {
      message.success(`${INTEGRATION_TYPE_LABELS[result.integration_type]}：${result.message}`);
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
    },
    onError: () => message.error("同步失败"),
  });

  const statusMap = new Map(
    data?.integrations.map((item) => [item.type, item]) ?? [],
  );

  const tableData = INTEGRATION_TYPES.map((type) => {
    const status = statusMap.get(type);
    return {
      type,
      label: INTEGRATION_TYPE_LABELS[type],
      last_sync_at: status?.last_sync_at,
      last_status: status?.last_status,
      synced_count: status?.synced_count,
      message: status?.message,
    };
  });

  const columns = [
    { title: "对接系统", dataIndex: "label", width: 140 },
    {
      title: "最近同步",
      dataIndex: "last_sync_at",
      width: 170,
      render: (v: string) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-"),
    },
    {
      title: "同步状态",
      dataIndex: "last_status",
      width: 100,
      render: (s: SyncStatus) =>
        s ? <Tag color={SYNC_STATUS_COLORS[s]}>{SYNC_STATUS_LABELS[s]}</Tag> : "-",
    },
    { title: "同步数量", dataIndex: "synced_count", width: 90, render: (v: number) => v ?? "-" },
    { title: "备注", dataIndex: "message", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "操作",
      width: 100,
      render: (_: unknown, record: { type: IntegrationType }) => (
        <Button
          type="primary"
          size="small"
          icon={<SyncOutlined />}
          loading={syncMutation.isPending && syncMutation.variables === record.type}
          onClick={() => syncMutation.mutate(record.type)}
        >
          同步
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader />

      <ContentCard title="快速同步" style={{ marginBottom: 16 }}>
        <Space wrap>
          {INTEGRATION_TYPES.map((type) => (
            <Button
              key={type}
              icon={<SyncOutlined />}
              onClick={() => syncMutation.mutate(type)}
              loading={syncMutation.isPending && syncMutation.variables === type}
            >
              同步{INTEGRATION_TYPE_LABELS[type]}
            </Button>
          ))}
        </Space>
      </ContentCard>

      <ContentCard noPadding>
        <Table
          rowKey="type"
          loading={isLoading}
          columns={columns}
          dataSource={tableData}
          pagination={false}
        />
      </ContentCard>
    </>
  );
}
