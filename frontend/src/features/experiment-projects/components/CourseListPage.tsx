import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Space, Table, message } from "antd";
import { useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { coursesApi, type Course, type CourseCreate } from "../api/experimentProjectsApi";

export function CourseListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form] = Form.useForm<CourseCreate>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["courses", page, keyword],
    queryFn: () => coursesApi.list({ page, page_size: 20, keyword: keyword || undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: (values: CourseCreate) =>
      editing ? coursesApi.update(editing.id, values) : coursesApi.create(values),
    onSuccess: () => {
      message.success(editing ? "更新成功" : "创建成功");
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-options"] });
    },
    onError: () => message.error("保存失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: coursesApi.delete,
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const columns = [
    { title: "课程编码", dataIndex: "code", width: 120 },
    { title: "课程名称", dataIndex: "name", ellipsis: true },
    { title: "院系", dataIndex: "department", width: 140, render: (v: string) => v || "-" },
    { title: "专业", dataIndex: "major", width: 140, render: (v: string) => v || "-" },
    {
      title: "操作",
      width: 140,
      render: (_: unknown, record: Course) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button type="link" danger size="small" onClick={() => deleteMutation.mutate(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            新建课程
          </Button>
        }
      />

      <FilterBar>
        <Input.Search placeholder="搜索课程" allowClear onSearch={setKeyword} style={{ width: 240 }} />
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
        title={editing ? "编辑课程" : "新建课程"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item name="code" label="课程编码" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="name" label="课程名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="院系">
            <Input />
          </Form.Item>
          <Form.Item name="major" label="专业">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
