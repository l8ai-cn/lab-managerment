import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Input, List, Select, Space, Tag, Upload, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi } from "@/features/users/api/usersApi";
import { uploadApi } from "@/shared/api/uploadApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  FAULT_STATUS_COLORS,
  FAULT_STATUS_LABELS,
  faultsApi,
  type FaultAttachment,
  type FaultStatus,
} from "../api/faultsApi";

const STATUS_OPTIONS = Object.entries(FAULT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function FaultDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [handleComment, setHandleComment] = useState("");
  const [newStatus, setNewStatus] = useState<FaultStatus>();
  const [assigneeId, setAssigneeId] = useState<string>();

  const { data, isLoading } = useQuery({
    queryKey: ["fault", id],
    queryFn: () => faultsApi.get(id!),
    enabled: !!id,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-assign-options"],
    queryFn: () => usersApi.list({ page_size: 100, role: "lab_admin" }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: FaultStatus) => faultsApi.updateStatus(id!, status),
    onSuccess: () => {
      message.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["fault", id] });
      queryClient.invalidateQueries({ queryKey: ["faults"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assignee_id: string) => faultsApi.assign(id!, assignee_id),
    onSuccess: () => {
      message.success("已指派处理人");
      queryClient.invalidateQueries({ queryKey: ["fault", id] });
    },
  });

  const handleMutation = useMutation({
    mutationFn: ({ action, comment }: { action: string; comment?: string }) =>
      faultsApi.handle(id!, action, comment),
    onSuccess: () => {
      message.success("处理记录已添加");
      setHandleComment("");
      queryClient.invalidateQueries({ queryKey: ["fault", id] });
    },
  });

  const attachmentMutation = useMutation({
    mutationFn: (attachments: FaultAttachment[]) =>
      faultsApi.update(id!, { attachments }),
    onSuccess: () => {
      message.success("附件已更新");
      queryClient.invalidateQueries({ queryKey: ["fault", id] });
    },
  });

  const userOptions =
    usersData?.items.map((u) => ({ value: u.id, label: `${u.name} (${u.username})` })) ?? [];

  const attachments = (data?.attachments as FaultAttachment[] | undefined) ?? [];

  if (isLoading || !data) return null;

  return (
    <>
      <PageHeader
        title={data.fault_type}
        subtitle={data.lab_name ?? undefined}
        breadcrumb={[
          { title: "运维管理" },
          { title: "故障上报", path: "/faults" },
          { title: data.fault_type },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/faults")}>
            返回列表
          </Button>
        }
      />

      <ContentCard title="故障详情" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="故障类型">{data.fault_type}</Descriptions.Item>
          <Descriptions.Item label="实验室">{data.lab_name ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={FAULT_STATUS_COLORS[data.status]}>
              {FAULT_STATUS_LABELS[data.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="上报时间">
            {dayjs(data.created_at).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {data.description}
          </Descriptions.Item>
        </Descriptions>
      </ContentCard>

      <ContentCard title="附件" style={{ marginBottom: 16 }}>
        {attachments.length > 0 && (
          <List
            size="small"
            dataSource={attachments}
            renderItem={(item) => (
              <List.Item>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.filename}
                </a>
              </List.Item>
            )}
            style={{ marginBottom: 12 }}
          />
        )}
        <Upload
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const result = await uploadApi.upload(file as File);
              attachmentMutation.mutate([
                ...attachments,
                { url: result.url, filename: result.filename },
              ]);
              onSuccess?.(result);
            } catch {
              onError?.(new Error("upload failed"));
            }
          }}
        >
          <Button size="small">添加附件</Button>
        </Upload>
      </ContentCard>

      <ContentCard title="处理操作">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space wrap>
            <Select
              placeholder="指派处理人"
              options={userOptions}
              style={{ width: 200 }}
              value={assigneeId ?? data.assignee_id}
              onChange={setAssigneeId}
            />
            <Button
              type="primary"
              disabled={!assigneeId}
              onClick={() => assigneeId && assignMutation.mutate(assigneeId)}
              loading={assignMutation.isPending}
            >
              指派
            </Button>
          </Space>
          <Space wrap>
            <Select
              placeholder="更新状态"
              options={STATUS_OPTIONS}
              style={{ width: 140 }}
              value={newStatus}
              onChange={setNewStatus}
            />
            <Button
              type="primary"
              disabled={!newStatus}
              onClick={() => newStatus && statusMutation.mutate(newStatus)}
              loading={statusMutation.isPending}
            >
              更新状态
            </Button>
          </Space>
          <Input.TextArea
            rows={3}
            placeholder="处理备注"
            value={handleComment}
            onChange={(e) => setHandleComment(e.target.value)}
          />
          <Space wrap>
            <Button
              onClick={() =>
                handleMutation.mutate({ action: "现场检查", comment: handleComment })
              }
              loading={handleMutation.isPending}
            >
              现场检查
            </Button>
            <Button
              type="primary"
              onClick={() =>
                handleMutation.mutate({ action: "维修完成", comment: handleComment })
              }
              loading={handleMutation.isPending}
            >
              标记完成
            </Button>
            <Button
              danger
              onClick={() =>
                handleMutation.mutate({ action: "无法修复", comment: handleComment })
              }
              loading={handleMutation.isPending}
            >
              无法修复
            </Button>
          </Space>
        </Space>
      </ContentCard>
    </>
  );
}
