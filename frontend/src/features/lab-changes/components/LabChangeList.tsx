import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Space, Table, Tag, message } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { labsApi } from "@/features/labs/api/labsApi";
import {
  CHANGE_STATUS_COLORS,
  CHANGE_STATUS_LABELS,
  CHANGE_TYPE_LABELS,
  labChangesApi,
  type ChangeStatus,
  type ChangeType,
} from "../api/labChangesApi";

const TYPE_OPTIONS = Object.entries(CHANGE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(CHANGE_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function LabChangeList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ChangeStatus>();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lab-changes", page, statusFilter],
    queryFn: () => labChangesApi.list({ page, status: statusFilter }),
  });

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: labChangesApi.create,
    onSuccess: async (created) => {
      await labChangesApi.submit(created.id);
      message.success("变更申请已提交");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["lab-changes"] });
    },
    onError: () => message.error("提交失败"),
  });

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      render: (title: string, record: { id: string }) => (
        <Link to={`/lab-changes/${record.id}`}>{title}</Link>
      ),
    },
    {
      title: "实验室",
      key: "lab",
      width: 160,
      render: (_: unknown, r: { lab_code?: string; lab_name?: string }) =>
        r.lab_code ? `${r.lab_code} ${r.lab_name}` : "-",
    },
    {
      title: "变更类型",
      dataIndex: "change_type",
      width: 120,
      render: (v: ChangeType) => CHANGE_TYPE_LABELS[v],
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 130,
      render: (s: ChangeStatus) => (
        <Tag color={CHANGE_STATUS_COLORS[s]}>{CHANGE_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "申请人",
      dataIndex: "applicant_name",
      width: 100,
      render: (v: string) => v || "-",
    },
    {
      title: "申请时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="筛选状态"
          allowClear
          options={STATUS_OPTIONS}
          style={{ width: 160 }}
          onChange={setStatusFilter}
        />
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新建变更申请
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
        title="新建变更申请"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item name="lab_id" label="实验室" rules={[{ required: true }]}>
            <Select options={labOptions} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="change_type" label="变更类型" rules={[{ required: true }]}>
            <Select options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="title" label="变更标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="变更说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
