import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Space, Tag, message } from "antd";
import { useState } from "react";
import { useAuth } from "@/shared/auth/AuthContext";
import {
  CHECK_IN_METHOD_LABELS,
  labBookingsApi,
  type CheckInMethod,
  type LabBookingStatus,
} from "../api/labBookingsApi";

interface LabUsageRecordPanelProps {
  bookingId: string;
  status: LabBookingStatus;
  onUpdated?: () => void;
}

export function LabUsageRecordPanel({ bookingId, status, onUpdated }: LabUsageRecordPanelProps) {
  const [form] = Form.useForm();
  const [rejectComment, setRejectComment] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "lab_admin" || user?.role === "system_admin";

  const shouldLoadUsage = status === "completed" || status === "approved";

  const { data: usageRecord } = useQuery({
    queryKey: ["lab-booking-usage", bookingId],
    queryFn: () => labBookingsApi.getUsage(bookingId),
    enabled: shouldLoadUsage,
    retry: false,
  });

  const checkInMutation = useMutation({
    mutationFn: (data: { method: CheckInMethod; actual_count?: number }) =>
      labBookingsApi.checkIn(bookingId, data),
    onSuccess: () => {
      message.success("签到成功");
      onUpdated?.();
    },
    onError: () => message.error("签到失败"),
  });

  const submitMutation = useMutation({
    mutationFn: (values: { content?: string; actual_count?: number }) =>
      labBookingsApi.submitUsage(bookingId, {
        content: values.content,
        parameters: values.actual_count ? { actual_count: values.actual_count } : undefined,
      }),
    onSuccess: () => {
      message.success("使用记录已提交");
      queryClient.invalidateQueries({ queryKey: ["lab-booking-usage", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      onUpdated?.();
    },
    onError: () => message.error("提交失败"),
  });

  const approveMutation = useMutation({
    mutationFn: () => labBookingsApi.approveUsage(bookingId),
    onSuccess: () => {
      message.success("已通过审核");
      queryClient.invalidateQueries({ queryKey: ["lab-booking-usage", bookingId] });
      onUpdated?.();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => labBookingsApi.rejectUsage(bookingId, rejectComment || "不符合要求"),
    onSuccess: () => {
      message.success("已驳回");
      queryClient.invalidateQueries({ queryKey: ["lab-booking-usage", bookingId] });
      onUpdated?.();
    },
  });

  if (status === "approved" && !usageRecord) {
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space wrap>
          {(Object.keys(CHECK_IN_METHOD_LABELS) as CheckInMethod[]).map((method) => (
            <Button
              key={method}
              size="small"
              onClick={() => checkInMutation.mutate({ method })}
              loading={checkInMutation.isPending}
            >
              {CHECK_IN_METHOD_LABELS[method]}签到
            </Button>
          ))}
        </Space>
        <Form form={form} layout="inline" onFinish={(v) => submitMutation.mutate(v)}>
          <Form.Item name="content" rules={[{ required: true, message: "请填写使用内容" }]}>
            <Input placeholder="使用记录内容" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="actual_count">
            <InputNumber min={0} placeholder="实际人数" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitMutation.isPending}>
              提交使用记录
            </Button>
          </Form.Item>
        </Form>
      </Space>
    );
  }

  if (usageRecord || status === "completed") {
    const reviewStatus = usageRecord?.review_status ?? "pending";
    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          审核状态：
          <Tag color={reviewStatus === "approved" ? "green" : reviewStatus === "rejected" ? "red" : "orange"}>
            {reviewStatus === "approved" ? "已通过" : reviewStatus === "rejected" ? "已驳回" : "待审核"}
          </Tag>
        </div>
        {usageRecord?.content && <div>使用内容：{usageRecord.content}</div>}
        {isAdmin && reviewStatus === "pending" && usageRecord && (
          <Space>
            <Button type="primary" size="small" onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>
              通过
            </Button>
            <Input
              placeholder="驳回原因"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              style={{ width: 160 }}
            />
            <Button danger size="small" onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending}>
              驳回
            </Button>
          </Space>
        )}
      </Space>
    );
  }

  return null;
}
