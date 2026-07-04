import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Popconfirm, Table, message } from "antd";
import { useState } from "react";
import { FilterBar } from "@/shared/components/FilterBar";
import { dataReportingApi, type ReportTemplate, type TemplateCreate } from "../api/dataReportingApi";

export function TemplateList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [schemaText, setSchemaText] = useState("");
  const [createForm] = Form.useForm<TemplateCreate>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["report-templates", page, keyword],
    queryFn: () =>
      dataReportingApi.listTemplates({ page, page_size: 20, keyword: keyword || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, schema }: { id: string; schema: Record<string, unknown> }) =>
      dataReportingApi.updateTemplate(id, { schema }),
    onSuccess: () => {
      message.success("Schema 已更新");
      setSchemaOpen(false);
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
    onError: () => message.error("更新失败，请检查 JSON 格式"),
  });

  const createMutation = useMutation({
    mutationFn: dataReportingApi.createTemplate,
    onSuccess: () => {
      message.success("模板已创建");
      setCreateOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
    onError: () => message.error("创建失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: dataReportingApi.deleteTemplate,
    onSuccess: () => {
      message.success("已删除");
      queryClient.invalidateQueries({ queryKey: ["report-templates"] });
    },
  });

  const columns = [
    { title: "模板编码", dataIndex: "code", width: 140 },
    { title: "模板名称", dataIndex: "name", ellipsis: true },
    { title: "说明", dataIndex: "description", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "操作",
      width: 200,
      render: (_: unknown, record: ReportTemplate) => (
        <>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setSchemaText(JSON.stringify(record.schema ?? {}, null, 2));
              setSchemaOpen(true);
            }}
          >
            Schema
          </Button>
          <Popconfirm
            title="确认删除该模板？"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <FilterBar>
        <Input.Search
          placeholder="搜索模板"
          allowClear
          onSearch={setKeyword}
          style={{ width: 240 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建模板
        </Button>
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
        title={`编辑 Schema — ${editing?.name ?? ""}`}
        open={schemaOpen}
        onCancel={() => setSchemaOpen(false)}
        onOk={() => {
          if (!editing) return;
          try {
            const schema = JSON.parse(schemaText) as Record<string, unknown>;
            updateMutation.mutate({ id: editing.id, schema });
          } catch {
            message.error("JSON 格式无效");
          }
        }}
        confirmLoading={updateMutation.isPending}
        width={640}
      >
        <Input.TextArea
          rows={16}
          value={schemaText}
          onChange={(e) => setSchemaText(e.target.value)}
          style={{ fontFamily: "monospace", fontSize: 13 }}
          placeholder='{"fields": [...]}'
        />
      </Modal>

      <Modal
        title="新建填报模板"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) =>
            createMutation.mutate({
              ...values,
              schema: values.schema ? JSON.parse(values.schema as unknown as string) : {},
            })
          }
        >
          <Form.Item name="code" label="模板编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input />
          </Form.Item>
          <Form.Item name="schema" label="Schema (JSON)">
            <Input.TextArea rows={6} placeholder='{"fields": []}' />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
