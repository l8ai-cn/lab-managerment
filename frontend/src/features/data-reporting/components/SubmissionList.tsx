import { DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, Upload, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { FilterBar } from "@/shared/components/FilterBar";
import {
  SUBMISSION_STATUS_COLORS,
  SUBMISSION_STATUS_LABELS,
  dataReportingApi,
  type ReportSubmission,
  type ReportSubmissionStatus,
} from "../api/dataReportingApi";

const STATUS_OPTIONS = Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function SubmissionList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportSubmissionStatus>();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<ReportSubmission | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: templatesData } = useQuery({
    queryKey: ["report-templates-options"],
    queryFn: () => dataReportingApi.listTemplates({ page_size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["report-submissions", page, statusFilter],
    queryFn: () =>
      dataReportingApi.listSubmissions({ page, page_size: 20, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: dataReportingApi.createSubmission,
    onSuccess: () => {
      message.success("填报记录已创建");
      setSubmitOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["report-submissions"] });
    },
    onError: () => message.error("创建失败"),
  });

  const submitMutation = useMutation({
    mutationFn: dataReportingApi.submit,
    onSuccess: () => {
      message.success("已提交");
      queryClient.invalidateQueries({ queryKey: ["report-submissions"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: dataReportingApi.approve,
    onSuccess: () => {
      message.success("已审核通过");
      queryClient.invalidateQueries({ queryKey: ["report-submissions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { unit_name?: string; period?: string; data?: Record<string, unknown> } }) =>
      dataReportingApi.updateSubmission(id, data),
    onSuccess: () => {
      message.success("已保存");
      setEditOpen(null);
      queryClient.invalidateQueries({ queryKey: ["report-submissions"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => dataReportingApi.exportSubmissions(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "submissions.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      message.success("导出成功");
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => dataReportingApi.importSubmissions(file),
    onSuccess: (result) => {
      message.success(`已导入 ${result.imported} 条`);
      queryClient.invalidateQueries({ queryKey: ["report-submissions"] });
    },
  });

  const templateOptions =
    templatesData?.items.map((t) => ({ value: t.id, label: `${t.code} ${t.name}` })) ?? [];

  const columns = [
    { title: "模板", dataIndex: "template_name", width: 160 },
    { title: "填报单位", dataIndex: "unit_name", width: 140 },
    { title: "填报周期", dataIndex: "period", width: 120 },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: ReportSubmissionStatus) => (
        <Tag color={SUBMISSION_STATUS_COLORS[s]}>{SUBMISSION_STATUS_LABELS[s]}</Tag>
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
      width: 180,
      render: (_: unknown, record: ReportSubmission) => (
        <Space size="small">
          {record.status === "draft" && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setEditOpen(record);
                  editForm.setFieldsValue({
                    unit_name: record.unit_name,
                    period: record.period,
                    data: JSON.stringify(record.data ?? {}, null, 2),
                  });
                }}
              >
                编辑
              </Button>
              <Button type="link" size="small" onClick={() => submitMutation.mutate(record.id)}>
                提交
              </Button>
            </>
          )}
          {record.status === "submitted" && (
            <Button type="link" size="small" onClick={() => approveMutation.mutate(record.id)}>
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <Select
          placeholder="状态筛选"
          allowClear
          options={STATUS_OPTIONS}
          style={{ width: 140 }}
          onChange={setStatusFilter}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitOpen(true)}>
          新建填报
        </Button>
        <Button icon={<DownloadOutlined />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          导出
        </Button>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          beforeUpload={(file) => {
            importMutation.mutate(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} loading={importMutation.isPending}>
            导入
          </Button>
        </Upload>
      </FilterBar>

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

      <Modal
        title="新建数据填报"
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            createMutation.mutate({
              template_id: values.template_id,
              unit_name: values.unit_name,
              period: values.period,
              data: values.data ? JSON.parse(values.data) : {},
            })
          }
        >
          <Form.Item name="template_id" label="填报模板" rules={[{ required: true }]}>
            <Select options={templateOptions} placeholder="选择模板" />
          </Form.Item>
          <Form.Item name="unit_name" label="填报单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="period" label="填报周期" rules={[{ required: true }]}>
            <Input placeholder="如 2025-Q1" />
          </Form.Item>
          <Form.Item name="data" label="填报数据 (JSON)">
            <Input.TextArea rows={4} placeholder='{"key": "value"}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑填报草稿"
        open={!!editOpen}
        onCancel={() => setEditOpen(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        width={520}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editOpen) return;
            updateMutation.mutate({
              id: editOpen.id,
              data: {
                unit_name: values.unit_name,
                period: values.period,
                data: values.data ? JSON.parse(values.data) : {},
              },
            });
          }}
        >
          <Form.Item name="unit_name" label="填报单位" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="period" label="填报周期" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="data" label="填报数据 (JSON)">
            <Input.TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
