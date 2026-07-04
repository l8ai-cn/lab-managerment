import { PlusOutlined, WarningOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Col, Form, Input, Modal, Row, Select, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { labsApi } from "@/features/labs/api/labsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatCard } from "@/shared/components/StatCard";
import {
  FAULT_STATUS_COLORS,
  FAULT_STATUS_LABELS,
  faultsApi,
  type FaultReport,
  type FaultStatus,
} from "../api/faultsApi";

const STATUS_OPTIONS = Object.entries(FAULT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function FaultList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FaultStatus>();
  const [labId, setLabId] = useState<string>();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["fault-stats"],
    queryFn: faultsApi.stats,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["faults", page, statusFilter, labId],
    queryFn: () =>
      faultsApi.list({ page, page_size: 20, status: statusFilter, lab_id: labId }),
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const columns = [
    {
      title: "故障类型",
      dataIndex: "fault_type",
      width: 120,
      render: (v: string, record: FaultReport) => (
        <Link to={`/faults/${record.id}`}>{v}</Link>
      ),
    },
    { title: "实验室", dataIndex: "lab_name", width: 140 },
    { title: "描述", dataIndex: "description", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: FaultStatus) => (
        <Tag color={FAULT_STATUS_COLORS[s]}>{FAULT_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "上报时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setReportOpen(true)}>
            上报故障
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title="故障总数" value={stats?.total ?? 0} icon={<WarningOutlined />} color="#ef4444" />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="待处理"
            value={stats?.by_status?.pending ?? 0}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="处理中"
            value={(stats?.by_status?.assigned ?? 0) + (stats?.by_status?.processing ?? 0)}
            color="#0ea5e9"
          />
        </Col>
      </Row>

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

      <FaultReportForm open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}

interface FaultReportFormProps {
  open: boolean;
  onClose: () => void;
}

export function FaultReportForm({ open, onClose }: FaultReportFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: faultsApi.create,
    onSuccess: () => {
      message.success("故障已上报");
      form.resetFields();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["faults"] });
      queryClient.invalidateQueries({ queryKey: ["fault-stats"] });
    },
    onError: () => message.error("上报失败"),
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  return (
    <Modal
      title="上报故障"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={createMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
        <Form.Item name="lab_id" label="实验室" rules={[{ required: true }]}>
          <Select options={labOptions} placeholder="选择实验室" />
        </Form.Item>
        <Form.Item name="fault_type" label="故障类型" rules={[{ required: true }]}>
          <Input placeholder="如：设备故障、水电故障" />
        </Form.Item>
        <Form.Item name="description" label="故障描述" rules={[{ required: true }]}>
          <Input.TextArea rows={4} placeholder="请详细描述故障情况" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
