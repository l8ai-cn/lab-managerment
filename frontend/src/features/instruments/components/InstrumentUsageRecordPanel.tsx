import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Space, Tag, Upload, message } from "antd";
import { useState } from "react";
import { useAuth } from "@/shared/auth/AuthContext";
import { uploadApi } from "@/shared/api/uploadApi";
import {
  instrumentBookingsApi,
  type BookingStatus,
} from "../api/instrumentsApi";

interface InstrumentUsageRecordPanelProps {
  bookingId: string;
  status: BookingStatus;
  onUpdated?: () => void;
}

export function InstrumentUsageRecordPanel({
  bookingId,
  status,
  onUpdated,
}: InstrumentUsageRecordPanelProps) {
  const [form] = Form.useForm();
  const [attachments, setAttachments] = useState<Array<{ url: string; filename: string }>>([]);
  const [rejectComment, setRejectComment] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "lab_admin" || user?.role === "system_admin";

  const shouldLoadUsage = ["approved", "in_use", "completed"].includes(status);

  const { data: usageRecord } = useQuery({
    queryKey: ["instrument-booking-usage", bookingId],
    queryFn: () => instrumentBookingsApi.getUsage(bookingId),
    enabled: shouldLoadUsage,
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (values: { content?: string; status_feedback?: string }) =>
      instrumentBookingsApi.submitUsage(bookingId, {
        content: values.content,
        status_feedback: values.status_feedback,
        attachments,
      }),
    onSuccess: () => {
      message.success("使用记录已提交");
      queryClient.invalidateQueries({ queryKey: ["instrument-booking-usage", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
      onUpdated?.();
    },
    onError: () => message.error("提交失败"),
  });

  const approveMutation = useMutation({
    mutationFn: () => instrumentBookingsApi.approveUsage(bookingId),
    onSuccess: () => {
      message.success("已通过审核");
      queryClient.invalidateQueries({ queryKey: ["instrument-booking-usage", bookingId] });
      onUpdated?.();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      instrumentBookingsApi.rejectUsage(bookingId, rejectComment || "不符合要求"),
    onSuccess: () => {
      message.success("已驳回");
      queryClient.invalidateQueries({ queryKey: ["instrument-booking-usage", bookingId] });
      onUpdated?.();
    },
  });

  if ((status === "approved" || status === "in_use") && !usageRecord) {
    return (
      <Form form={form} layout="vertical" onFinish={(v) => submitMutation.mutate(v)}>
        <Form.Item name="content" label="使用内容" rules={[{ required: true }]}>
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="status_feedback" label="设备状态反馈">
          <Input placeholder="如：运行正常" />
        </Form.Item>
        <Form.Item label="附件">
          <Upload
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                const result = await uploadApi.upload(file as File);
                setAttachments((prev) => [...prev, { url: result.url, filename: result.filename }]);
                onSuccess?.(result);
              } catch {
                onError?.(new Error("upload failed"));
              }
            }}
            showUploadList={{ showRemoveIcon: true }}
          >
            <Button size="small">上传附件</Button>
          </Upload>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitMutation.isPending}>
          提交使用记录
        </Button>
      </Form>
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
