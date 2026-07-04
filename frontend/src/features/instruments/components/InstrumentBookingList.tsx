import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
  instrumentBookingsApi,
  instrumentsApi,
  type BookingStatus,
  type InstrumentBooking,
} from "../api/instrumentsApi";

const STATUS_OPTIONS = Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function InstrumentBookingList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus>();
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["instrument-bookings", page, statusFilter],
    queryFn: () =>
      instrumentBookingsApi.list({ page, page_size: 20, status: statusFilter }),
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ["instruments-options"],
    queryFn: () => instrumentsApi.list({ page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: instrumentBookingsApi.create,
    onSuccess: () => {
      message.success("预约申请已提交");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
    onError: () => message.error("预约失败"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => instrumentBookingsApi.approve(id),
    onSuccess: () => {
      message.success("已通过");
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      instrumentBookingsApi.reject(id, comment),
    onSuccess: () => {
      message.success("已拒绝");
      setRejectModal(null);
      setRejectComment("");
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
  });

  const instrumentOptions =
    instrumentsData?.items.map((i) => ({ value: i.id, label: `${i.code} ${i.name}` })) ?? [];

  const columns = [
    { title: "仪器", dataIndex: "instrument_name", ellipsis: true },
    {
      title: "开始时间",
      dataIndex: "start_time",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "结束时间",
      dataIndex: "end_time",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    { title: "用途", dataIndex: "purpose", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: BookingStatus) => (
        <Tag color={BOOKING_STATUS_COLORS[s]}>{BOOKING_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "操作",
      width: 140,
      render: (_: unknown, record: InstrumentBooking) =>
        record.status === "pending" ? (
          <Space size="small">
            <Button type="link" size="small" onClick={() => approveMutation.mutate(record.id)}>
              通过
            </Button>
            <Button
              type="link"
              danger
              size="small"
              onClick={() => setRejectModal({ id: record.id })}
            >
              拒绝
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          options={STATUS_OPTIONS}
          style={{ width: 140 }}
          onChange={setStatusFilter}
        />
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新建预约
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Modal
        title="新建仪器预约"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const [start, end] = values.timeRange;
            createMutation.mutate({
              instrument_id: values.instrument_id,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              purpose: values.purpose,
              project_name: values.project_name,
            });
          }}
        >
          <Form.Item name="instrument_id" label="仪器" rules={[{ required: true }]}>
            <Select options={instrumentOptions} placeholder="选择仪器" />
          </Form.Item>
          <Form.Item name="timeRange" label="预约时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="purpose" label="用途" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="project_name" label="项目名称">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝预约"
        open={!!rejectModal}
        onCancel={() => {
          setRejectModal(null);
          setRejectComment("");
        }}
        onOk={() => {
          if (!rejectModal) return;
          rejectMutation.mutate({ id: rejectModal.id, comment: rejectComment || "不符合要求" });
        }}
        confirmLoading={rejectMutation.isPending}
      >
        <Input.TextArea
          rows={3}
          placeholder="拒绝原因"
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
