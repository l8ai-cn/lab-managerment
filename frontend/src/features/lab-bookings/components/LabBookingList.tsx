import { DownloadOutlined, PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { labsApi } from "@/features/labs/api/labsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  LAB_BOOKING_STATUS_COLORS,
  LAB_BOOKING_STATUS_LABELS,
  USAGE_TYPE_LABELS,
  labBookingsApi,
  type AccessGrant,
  type LabBooking,
  type LabBookingStatus,
  type UsageType,
} from "../api/labBookingsApi";
import { CheckInModal } from "./CheckInModal";
import { LabBookingCalendar } from "./LabBookingCalendar";
import { LabUsageRecordPanel } from "./LabUsageRecordPanel";

const USAGE_OPTIONS = Object.entries(USAGE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(LAB_BOOKING_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const RECURRENCE_OPTIONS = [
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "biweekly", label: "每两周" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LabBookingList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LabBookingStatus>();
  const [labId, setLabId] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<LabBooking | null>(null);
  const [rejectModal, setRejectModal] = useState<LabBooking | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>([]);
  const [approvedLabName, setApprovedLabName] = useState<string>();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
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
      queryClient.invalidateQueries({ queryKey: ["lab-bookings-calendar"] });
    },
    onError: () => message.error("预约失败"),
  });

  const approveMutation = useMutation({
    mutationFn: async (record: LabBooking) => {
      const result = await labBookingsApi.approve(record.id);
      try {
        const grants = await labBookingsApi.getAccessGrants(record.id);
        setAccessGrants(grants);
        setApprovedLabName(record.lab_name);
        setCheckInOpen(true);
      } catch {
        setAccessGrants([]);
        setCheckInOpen(true);
      }
      return result;
    },
    onSuccess: () => {
      message.success("已通过");
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["lab-bookings-calendar"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: labBookingsApi.cancel,
    onSuccess: () => {
      message.success("已取消");
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["lab-bookings-calendar"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      labBookingsApi.reject(id, comment),
    onSuccess: () => {
      message.success("已拒绝");
      setRejectModal(null);
      setRejectComment("");
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["lab-bookings-calendar"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof labBookingsApi.update>[1] }) =>
      labBookingsApi.update(id, data),
    onSuccess: () => {
      message.success("预约已更新");
      setEditModal(null);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["lab-bookings-calendar"] });
    },
    onError: () => message.error("更新失败"),
  });

  const exportMutation = useMutation({
    mutationFn: () => labBookingsApi.exportBookings({ lab_id: labId, status: statusFilter }),
    onSuccess: (blob) => {
      downloadBlob(blob, `lab_bookings_${dayjs().format("YYYYMMDD")}.xlsx`);
      message.success("导出成功");
    },
    onError: () => message.error("导出失败"),
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
      title: "周期",
      dataIndex: "is_recurring",
      width: 70,
      render: (v: boolean) => (v ? <Tag color="purple">周期</Tag> : "-"),
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
      width: 200,
      render: (_: unknown, record: LabBooking) => (
        <Space size="small" wrap>
          {record.status === "pending" && (
            <>
              <Button type="link" size="small" onClick={() => approveMutation.mutate(record)}>
                通过
              </Button>
              <Button type="link" danger size="small" onClick={() => setRejectModal(record)}>
                拒绝
              </Button>
            </>
          )}
          {(record.status === "pending" || record.status === "approved") && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setEditModal(record);
                  editForm.setFieldsValue({
                    usage_type: record.usage_type,
                    purpose: record.purpose,
                    expected_count: record.expected_count,
                    timeRange: [dayjs(record.start_time), dayjs(record.end_time)],
                  });
                }}
              >
                编辑
              </Button>
              <Button type="link" danger size="small" onClick={() => cancelMutation.mutate(record.id)}>
                取消
              </Button>
            </>
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
            <Link to="/lab-bookings/rules">
              <Button icon={<SettingOutlined />}>预约规则</Button>
            </Link>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
            >
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              新建预约
            </Button>
          </Space>
        }
      />

      <Tabs
        items={[
          {
            key: "list",
            label: "预约列表",
            children: (
              <>
                <FilterBar>
                  <Select
                    placeholder="实验室"
                    allowClear
                    options={labOptions}
                    style={{ width: 180 }}
                    value={labId}
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
                    expandable={{
                      expandedRowRender: (record) => (
                        <LabUsageRecordPanel bookingId={record.id} status={record.status} />
                      ),
                      rowExpandable: (record) =>
                        record.status === "approved" || record.status === "completed",
                    }}
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
              </>
            ),
          },
          { key: "calendar", label: "日历视图", children: <LabBookingCalendar /> },
        ]}
      />

      <Modal
        title="新建实验室预约"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={520}
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
              is_recurring: values.is_recurring ?? false,
              recurrence_rule: values.is_recurring
                ? {
                    frequency: values.recurrence_frequency,
                    count: values.recurrence_count,
                    until: values.recurrence_until?.toISOString(),
                  }
                : undefined,
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
          <Form.Item name="is_recurring" valuePropName="checked">
            <Checkbox>周期性预约</Checkbox>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.is_recurring !== cur.is_recurring}>
            {({ getFieldValue }) =>
              getFieldValue("is_recurring") ? (
                <>
                  <Form.Item name="recurrence_frequency" label="重复频率" rules={[{ required: true }]}>
                    <Select options={RECURRENCE_OPTIONS} />
                  </Form.Item>
                  <Form.Item name="recurrence_count" label="重复次数">
                    <InputNumber min={2} max={52} style={{ width: "100%" }} placeholder="如 10 次" />
                  </Form.Item>
                  <Form.Item name="recurrence_until" label="截止日期">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <CheckInModal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        labName={approvedLabName}
        grants={accessGrants}
      />

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

      <Modal
        title="编辑预约"
        open={!!editModal}
        onCancel={() => setEditModal(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        destroyOnClose
        width={520}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editModal) return;
            const [start, end] = values.timeRange;
            updateMutation.mutate({
              id: editModal.id,
              data: {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                usage_type: values.usage_type,
                purpose: values.purpose,
                expected_count: values.expected_count,
              },
            });
          }}
        >
          <Form.Item name="usage_type" label="用途类型" rules={[{ required: true }]}>
            <Select options={USAGE_OPTIONS} />
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
