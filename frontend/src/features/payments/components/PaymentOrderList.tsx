import { DownloadOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  FEE_TYPE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  paymentsApi,
  type FeeType,
  type PaymentOrder,
  type PaymentStatus,
} from "../api/paymentsApi";

const STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const FEE_OPTIONS = Object.entries(FEE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PaymentOrderList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus>();
  const [createOpen, setCreateOpen] = useState(false);
  const [bookingPayOpen, setBookingPayOpen] = useState(false);
  const [form] = Form.useForm();
  const [bookingForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["payment-orders", page, statusFilter],
    queryFn: () => paymentsApi.list({ page, page_size: 20, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      message.success("订单已创建");
      setCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
    onError: () => message.error("创建失败"),
  });

  const bookingPayMutation = useMutation({
    mutationFn: ({ bookingId, amount }: { bookingId: string; amount: number }) =>
      paymentsApi.createBookingPayment(bookingId, amount),
    onSuccess: (order) => {
      message.success(`预约支付订单已创建：${order.id.slice(0, 8)}…`);
      setBookingPayOpen(false);
      bookingForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
    onError: () => message.error("创建支付订单失败"),
  });

  const payMutation = useMutation({
    mutationFn: paymentsApi.pay,
    onSuccess: (result) => {
      message.success(result.message || "支付成功");
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
    onError: () => message.error("支付失败"),
  });

  const receiptMutation = useMutation({
    mutationFn: paymentsApi.downloadReceipt,
    onSuccess: (blob, orderId) => {
      downloadBlob(blob, `receipt_${orderId}.pdf`);
      message.success("收据已下载");
    },
    onError: () => message.error("收据下载失败"),
  });

  const columns = [
    { title: "订单号", dataIndex: "id", width: 280, ellipsis: true },
    {
      title: "费用类型",
      dataIndex: "fee_type",
      width: 120,
      render: (v: FeeType) => FEE_TYPE_LABELS[v],
    },
    {
      title: "关联",
      key: "ref",
      width: 160,
      ellipsis: true,
      render: (_: unknown, record: PaymentOrder) =>
        record.ref_type ? `${record.ref_type} / ${record.ref_id.slice(0, 8)}…` : "-",
    },
    {
      title: "金额(元)",
      dataIndex: "amount",
      width: 100,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: PaymentStatus) => (
        <Tag color={PAYMENT_STATUS_COLORS[s]}>{PAYMENT_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      width: 160,
      render: (_: unknown, record: PaymentOrder) => (
        <Space size="small">
          {record.status === "pending" && (
            <Button
              type="link"
              size="small"
              onClick={() => payMutation.mutate(record.id)}
              loading={payMutation.isPending}
            >
              支付
            </Button>
          )}
          {record.status === "paid" && (
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => receiptMutation.mutate(record.id)}
              loading={receiptMutation.isPending}
            >
              收据
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
          <Space>
            <Button icon={<LinkOutlined />} onClick={() => setBookingPayOpen(true)}>
              预约支付
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              创建订单
            </Button>
          </Space>
        }
      />

      <FilterBar>
        <Select
          placeholder="状态筛选"
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
        title="创建支付订单"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="fee_type" label="费用类型" rules={[{ required: true }]}>
            <Select options={FEE_OPTIONS} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="ref_type" label="关联类型" rules={[{ required: true }]}>
            <Input placeholder="如 lab_booking" />
          </Form.Item>
          <Form.Item name="ref_id" label="关联ID" rules={[{ required: true }]}>
            <Input placeholder="关联业务记录ID" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="实验室预约支付"
        open={bookingPayOpen}
        onCancel={() => setBookingPayOpen(false)}
        onOk={() => bookingForm.submit()}
        confirmLoading={bookingPayMutation.isPending}
        destroyOnClose
      >
        <Form
          form={bookingForm}
          layout="vertical"
          onFinish={(v) => bookingPayMutation.mutate(v)}
        >
          <Form.Item name="bookingId" label="预约ID" rules={[{ required: true }]}>
            <Input placeholder="实验室预约记录 ID" />
          </Form.Item>
          <Form.Item name="amount" label="支付金额(元)" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
