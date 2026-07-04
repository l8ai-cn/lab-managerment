import { EditOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Table, message } from "antd";
import { useState } from "react";
import { FilterBar } from "@/shared/components/FilterBar";
import { dataReportingApi, type ReportTemplate } from "../api/dataReportingApi";

export function TemplateList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [schemaText, setSchemaText] = useState("");
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

  const columns = [
    { title: "模板编码", dataIndex: "code", width: 140 },
    { title: "模板名称", dataIndex: "name", ellipsis: true },
    { title: "说明", dataIndex: "description", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "操作",
      width: 100,
      render: (_: unknown, record: ReportTemplate) => (
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
    </>
  );
}
