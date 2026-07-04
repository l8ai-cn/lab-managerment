import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Space, Table, Tabs, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { instrumentBookingsApi } from "@/features/instruments/api/instrumentsApi";
import { labBookingsApi } from "@/features/lab-bookings/api/labBookingsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

export function UsageApprovalPage() {
  const [labSelected, setLabSelected] = useState<string[]>([]);
  const [instSelected, setInstSelected] = useState<string[]>([]);
  const [rejectComment, setRejectComment] = useState("");
  const queryClient = useQueryClient();

  const { data: labPending, isLoading: labLoading } = useQuery({
    queryKey: ["lab-pending-usage"],
    queryFn: labBookingsApi.listPendingUsage,
  });

  const { data: instPending, isLoading: instLoading } = useQuery({
    queryKey: ["instrument-pending-usage"],
    queryFn: instrumentBookingsApi.listPendingUsage,
  });

  const labBatchMutation = useMutation({
    mutationFn: ({ ids, approve }: { ids: string[]; approve: boolean }) =>
      labBookingsApi.batchReviewUsage(ids, approve, approve ? undefined : rejectComment || "不符合要求"),
    onSuccess: (result) => {
      message.success(`已处理 ${result.processed} 条实验室使用记录`);
      setLabSelected([]);
      queryClient.invalidateQueries({ queryKey: ["lab-pending-usage"] });
    },
  });

  const instBatchMutation = useMutation({
    mutationFn: ({ ids, approve }: { ids: string[]; approve: boolean }) =>
      instrumentBookingsApi.batchReviewUsage(ids, approve, approve ? undefined : rejectComment || "不符合要求"),
    onSuccess: (result) => {
      message.success(`已处理 ${result.processed} 条仪器使用记录`);
      setInstSelected([]);
      queryClient.invalidateQueries({ queryKey: ["instrument-pending-usage"] });
    },
  });

  const labColumns = [
    { title: "实验室", dataIndex: "lab_name", width: 160 },
    { title: "使用内容", dataIndex: "content", ellipsis: true },
    {
      title: "提交时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const instColumns = [
    { title: "仪器", dataIndex: "instrument_name", width: 160 },
    { title: "使用内容", dataIndex: "content", ellipsis: true },
    {
      title: "提交时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <>
      <PageHeader subtitle="批量审核实验室与仪器使用记录" />

      <Tabs
        items={[
          {
            key: "lab",
            label: `实验室 (${labPending?.total ?? 0})`,
            children: (
              <ContentCard>
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    disabled={!labSelected.length}
                    loading={labBatchMutation.isPending}
                    onClick={() => labBatchMutation.mutate({ ids: labSelected, approve: true })}
                  >
                    批量通过 ({labSelected.length})
                  </Button>
                  <Input
                    placeholder="驳回原因（批量驳回时必填）"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    style={{ width: 220 }}
                  />
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    disabled={!labSelected.length}
                    loading={labBatchMutation.isPending}
                    onClick={() => labBatchMutation.mutate({ ids: labSelected, approve: false })}
                  >
                    批量驳回
                  </Button>
                </Space>
                <Table
                  rowKey="booking_id"
                  loading={labLoading}
                  dataSource={labPending?.items ?? []}
                  columns={labColumns}
                  rowSelection={{
                    selectedRowKeys: labSelected,
                    onChange: (keys) => setLabSelected(keys as string[]),
                  }}
                  pagination={false}
                />
              </ContentCard>
            ),
          },
          {
            key: "instrument",
            label: `仪器 (${instPending?.total ?? 0})`,
            children: (
              <ContentCard>
                <Space style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    disabled={!instSelected.length}
                    loading={instBatchMutation.isPending}
                    onClick={() => instBatchMutation.mutate({ ids: instSelected, approve: true })}
                  >
                    批量通过 ({instSelected.length})
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    disabled={!instSelected.length}
                    loading={instBatchMutation.isPending}
                    onClick={() => instBatchMutation.mutate({ ids: instSelected, approve: false })}
                  >
                    批量驳回
                  </Button>
                </Space>
                <Table
                  rowKey="booking_id"
                  loading={instLoading}
                  dataSource={instPending?.items ?? []}
                  columns={instColumns}
                  rowSelection={{
                    selectedRowKeys: instSelected,
                    onChange: (keys) => setInstSelected(keys as string[]),
                  }}
                  pagination={false}
                />
              </ContentCard>
            ),
          },
        ]}
      />
    </>
  );
}
