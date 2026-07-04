import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Descriptions, Input, Space, Steps, Tag, message } from "antd";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  CHANGE_STATUS_COLORS,
  CHANGE_STATUS_LABELS,
  CHANGE_TYPE_LABELS,
  labChangesApi,
  type ChangeStatus,
} from "../api/labChangesApi";

const STATUS_STEP: Record<ChangeStatus, number> = {
  draft: 0,
  pending_unit: 1,
  pending_center: 2,
  approved: 3,
  rejected: -1,
};

export function LabChangeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["lab-change", id],
    queryFn: () => labChangesApi.get(id!),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => labChangesApi.approve(id!, comment || undefined),
    onSuccess: () => {
      message.success("审批通过");
      queryClient.invalidateQueries({ queryKey: ["lab-change", id] });
      queryClient.invalidateQueries({ queryKey: ["lab-changes"] });
    },
    onError: () => message.error("操作失败"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => labChangesApi.reject(id!, comment),
    onSuccess: () => {
      message.success("已驳回");
      queryClient.invalidateQueries({ queryKey: ["lab-change", id] });
      queryClient.invalidateQueries({ queryKey: ["lab-changes"] });
    },
    onError: () => message.error("操作失败"),
  });

  if (isLoading || !data) return null;

  const canApprove =
    (data.status === "pending_unit" && user?.role === "dept_admin") ||
    (data.status === "pending_center" && user?.role === "system_admin") ||
    user?.role === "system_admin";

  const currentStep = STATUS_STEP[data.status];

  return (
    <>
      <PageHeader
        title={data.title}
        breadcrumb={[
          { title: "实验室管理" },
          { title: "变更管理", path: "/lab-changes" },
          { title: data.title },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/lab-changes")}>
            返回列表
          </Button>
        }
      />

      <ContentCard
        title={
          <Space>
            <span>{data.title}</span>
            <Tag color={CHANGE_STATUS_COLORS[data.status]}>
              {CHANGE_STATUS_LABELS[data.status]}
            </Tag>
          </Space>
        }
      >
        <Steps
          current={currentStep >= 0 ? currentStep : 0}
          status={data.status === "rejected" ? "error" : undefined}
          style={{ marginBottom: 24 }}
          items={[
            { title: "提交申请" },
            { title: "所在单位审核" },
            { title: "管理中心审核" },
            { title: "完成" },
          ]}
        />

        <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
          <Descriptions.Item label="实验室">
            {data.lab_code} {data.lab_name}
          </Descriptions.Item>
          <Descriptions.Item label="变更类型">
            {CHANGE_TYPE_LABELS[data.change_type]}
          </Descriptions.Item>
          <Descriptions.Item label="申请人">{data.applicant_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="申请时间">
            {new Date(data.created_at).toLocaleString("zh-CN")}
          </Descriptions.Item>
          <Descriptions.Item label="变更说明" span={2}>
            {data.description || "-"}
          </Descriptions.Item>
        </Descriptions>

        {data.approval_records.length > 0 && (
          <ContentCard type="inner" title="审批记录" style={{ marginBottom: 24 }}>
            {data.approval_records.map((r) => (
              <div key={r.id} style={{ marginBottom: 8 }}>
                <Tag>{r.node === "unit" ? "单位审核" : "管理中心审核"}</Tag>
                <Tag color={r.action === "approve" ? "success" : "error"}>
                  {r.action === "approve" ? "通过" : "驳回"}
                </Tag>
                {r.approver_name} — {r.comment || "无意见"} —{" "}
                {new Date(r.created_at).toLocaleString("zh-CN")}
              </div>
            ))}
          </ContentCard>
        )}

        {canApprove && ["pending_unit", "pending_center"].includes(data.status) && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              rows={2}
              placeholder="审批意见"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Space>
              <Button type="primary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
                通过
              </Button>
              <Button danger loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
                驳回
              </Button>
            </Space>
          </Space>
        )}
      </ContentCard>
    </>
  );
}
