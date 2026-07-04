import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  LAB_BOOKING_STATUS_COLORS,
  LAB_BOOKING_STATUS_LABELS,
  USAGE_TYPE_LABELS,
  labBookingsApi,
  type LabBooking,
  type LabBookingStatus,
  type UsageType,
} from "../api/labBookingsApi";

const USAGE_OPTIONS = Object.entries(USAGE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(LAB_BOOKING_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function LabBookingList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LabBookingStatus>();
  const [labId, setLabId] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["lab-bookings", page, statusFilter, labId],
    queryFn: () =>
      labBookingsApi.list({ page, page_size: 20, status: statusFilter, lab_id: labId }),
  });

  const createMutation = useMutation({
    mutationFn: labBookingsApi.create,
    onSuccess: () => {
      message.success("预约申请已提交");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
    },
    onError: () => message.error("预约失败"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => labBookingsApi.approve(id),
    onSuccess: () => {
      message.success("已通过");
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: labBookingsApi.cancel,
    onSuccess: () => {
      message.success("已取消");
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
    },
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const columns = [
    { title: "实验室", dataIndex: "lab_name", width: 140 },
    {
      title: "用途类型",
      dataIndex: "usage_type",
      width: 90,
      render: (v: UsageType) => USAGE_TYPE_LABELS[v],
    },
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
    { title: "目的", dataIndex: "purpose", ellipsis: true },
    {
      title: "人数",
      dataIndex: "expected_count",
      width: 70,
      render: (v: number) => v ?? "-",
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: LabBookingStatus) => (
        <Tag color={LAB_BOOKING_STATUS_COLORS[s]}>{LAB_BOOKING_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "操作",
      width: 140,
      render: (_: unknown, record: LabBooking) => (
        <Space size="small">
          {record.status === "pending" && (
            <Button type="link" size="small" onClick={() => approveMutation.mutate(record.id)}>
              通过
            </Button>
          )}
          {(record.status === "pending" || record.status === "approved") && (
            <Button type="link" danger size="small" onClick={() => cancelMutation.mutate(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新建预约
          </Button>
        }
      />

      <FilterBar>
        <Select
          placeholder="实验室"
          allowClear
          options={labOptions}
          style={{ width: 180 }}
          onChange={setLabId}
        />
        <Select
          placeholder="状态"
          allowClear
          options={STATUS_OPTIONS}
          style={{ width: 140 }}
          onChange={setStatusFilter}
        />
      </FilterBar>

      <ContentCard noPadding>
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
            showSizeChanger: false,
          }}
        />
      </ContentCard>

      <Modal
        title="新建实验室预约"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const [start, end] = values.timeRange;
            createMutation.mutate({
              lab_id: values.lab_id,
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              usage_type: values.usage_type,
              purpose: values.purpose,
              expected_count: values.expected_count,
            });
          }}
        >
          <Form.Item name="lab_id" label="实验室" rules={[{ required: true }]}>
            <Select options={labOptions} placeholder="选择实验室" />
          </Form.Item>
          <Form.Item name="usage_type" label="用途类型" rules={[{ required: true }]}>
            <Select options={USAGE_OPTIONS} placeholder="选择用途类型" />
          </Form.Item>
          <Form.Item name="timeRange" label="预约时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="purpose" label="使用目的" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="expected_count" label="预计人数">
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
