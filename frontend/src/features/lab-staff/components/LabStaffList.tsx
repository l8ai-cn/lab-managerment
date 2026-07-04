import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Space, Table, message } from "antd";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { labStaffApi } from "../api/labStaffApi";

export function LabStaffList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["lab-staff", page, keyword],
    queryFn: () => labStaffApi.list({ page, keyword: keyword || undefined }),
  });

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: labStaffApi.create,
    onSuccess: () => {
      message.success("创建成功");
      setModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["lab-staff"] });
    },
    onError: () => message.error("创建失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: labStaffApi.delete,
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["lab-staff"] });
    },
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const columns = [
    { title: "工号", dataIndex: "employee_no", width: 120 },
    { title: "姓名", dataIndex: "name", width: 100 },
    { title: "电话", dataIndex: "phone", width: 130, render: (v: string) => v || "-" },
    { title: "办公室", dataIndex: "office_location", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "责任实验室",
      key: "labs",
      render: (_: unknown, record: { labs: Array<{ code: string; name: string }> }) =>
        record.labs.map((l) => `${l.code}`).join("、") || "-",
    },
    {
      title: "操作",
      width: 80,
      render: (_: unknown, record: { id: string }) => (
        <Button
          type="link"
          danger
          size="small"
          onClick={() => deleteMutation.mutate(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search placeholder="搜索工号或姓名" onSearch={setKeyword} style={{ width: 220 }} />
        <Button type="primary" onClick={() => setModalOpen(true)}>
          新增实验员
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
        title="新增实验员"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item name="employee_no" label="工号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="office_location" label="办公室地点">
            <Input />
          </Form.Item>
          <Form.Item name="lab_ids" label="责任实验室">
            <Select mode="multiple" options={labOptions} placeholder="支持一人多室" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
