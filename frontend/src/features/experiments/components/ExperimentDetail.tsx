import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Descriptions, message, Space, Spin, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { experimentsApi } from "../api/experimentsApi";
import { STATUS_COLORS, STATUS_LABELS, type ExperimentStatus } from "../types/experiment";

const TRANSITION_ACTIONS: Partial<
  Record<ExperimentStatus, { action: string; label: string; type?: "primary" | "default" | "dashed" | "link" | "text" }[]>
> = {
  draft: [
    { action: "submit", label: "提交计划", type: "primary" },
    { action: "cancel", label: "取消" },
  ],
  planned: [
    { action: "start", label: "开始执行", type: "primary" },
    { action: "cancel", label: "取消" },
  ],
  in_progress: [
    { action: "pause", label: "暂停" },
    { action: "complete", label: "完成", type: "primary" },
    { action: "fail", label: "标记失败" },
  ],
  paused: [{ action: "resume", label: "恢复执行", type: "primary" }],
  completed: [{ action: "archive", label: "归档" }],
  failed: [{ action: "archive", label: "归档" }],
};

export function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["experiment", id],
    queryFn: () => experimentsApi.get(id!),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: (action: string) => experimentsApi.transition(id!, action),
    onSuccess: (result) => {
      message.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["experiment", id] });
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      message.error(err.response?.data?.detail ?? "操作失败");
    },
  });

  if (isLoading || !data) {
    return <Spin />;
  }

  const actions = TRANSITION_ACTIONS[data.status] ?? [];

  return (
    <Card
      title={
        <Space>
          <span>{data.code}</span>
          <Tag color={STATUS_COLORS[data.status]}>{STATUS_LABELS[data.status]}</Tag>
        </Space>
      }
      extra={
        <Space>
          {actions.map(({ action, label, type }) => (
            <Button
              key={action}
              type={type}
              loading={transitionMutation.isPending}
              onClick={() => transitionMutation.mutate(action)}
            >
              {label}
            </Button>
          ))}
          <Button onClick={() => navigate("/experiments")}>返回列表</Button>
        </Space>
      }
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label="标题" span={2}>
          {data.title}
        </Descriptions.Item>
        <Descriptions.Item label="描述" span={2}>
          {data.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="假设" span={2}>
          {data.hypothesis || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="计划开始">
          {data.planned_start ? new Date(data.planned_start).toLocaleString("zh-CN") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="计划结束">
          {data.planned_end ? new Date(data.planned_end).toLocaleString("zh-CN") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="实际开始">
          {data.actual_start ? new Date(data.actual_start).toLocaleString("zh-CN") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="实际结束">
          {data.actual_end ? new Date(data.actual_end).toLocaleString("zh-CN") : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {new Date(data.created_at).toLocaleString("zh-CN")}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {new Date(data.updated_at).toLocaleString("zh-CN")}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
