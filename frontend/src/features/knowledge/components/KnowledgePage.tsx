import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Space, Table, Tabs, Tag, message } from "antd";
import { useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  knowledgeApi,
  type KnowledgeDocument,
  type KnowledgeDocumentCreate,
} from "../api/knowledgeApi";

export function KnowledgePage() {
  const [page, setPage] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [searchMode, setSearchMode] = useState<"fts" | "hybrid">("hybrid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeDocument | null>(null);
  const [form] = Form.useForm<KnowledgeDocumentCreate>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["knowledge-docs", page],
    queryFn: () => knowledgeApi.list({ page, page_size: 20 }),
    enabled: !searchQ,
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["knowledge-search", searchQ, searchMode],
    queryFn: () =>
      searchMode === "hybrid"
        ? knowledgeApi.searchHybrid(searchQ)
        : knowledgeApi.search(searchQ),
    enabled: !!searchQ,
  });

  const saveMutation = useMutation({
    mutationFn: (values: KnowledgeDocumentCreate) =>
      editing ? knowledgeApi.update(editing.id, values) : knowledgeApi.create(values),
    onSuccess: () => {
      message.success(editing ? "已更新" : "已创建");
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["knowledge-docs"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-search"] });
    },
    onError: () => message.error("保存失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: knowledgeApi.delete,
    onSuccess: () => {
      message.success("已删除");
      queryClient.invalidateQueries({ queryKey: ["knowledge-docs"] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: KnowledgeDocument) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      category: record.category,
      tags: record.tags,
    });
    setModalOpen(true);
  };

  const docColumns = [
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "分类", dataIndex: "category", width: 120, render: (v: string) => v || "-" },
    {
      title: "标签",
      dataIndex: "tags",
      width: 180,
      render: (tags: string[] | undefined) =>
        tags?.map((t) => (
          <Tag key={t}>{t}</Tag>
        )) ?? "-",
    },
    {
      title: "操作",
      width: 120,
      render: (_: unknown, record: KnowledgeDocument) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => deleteMutation.mutate(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const searchColumns = [
    { title: "标题", dataIndex: "title", ellipsis: true },
    { title: "摘要", dataIndex: "snippet", ellipsis: true },
    { title: "分类", dataIndex: "category", width: 100, render: (v: string) => v || "-" },
    {
      title: "相关度",
      dataIndex: "score",
      width: 90,
      render: (v: number) => (v != null ? v.toFixed(2) : "-"),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建文档
          </Button>
        }
      />

      <FilterBar>
        <Input.Search
          placeholder="搜索知识库（支持中文）"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={setSearchQ}
          style={{ width: 320 }}
        />
        <Select
          value={searchMode}
          onChange={setSearchMode}
          style={{ width: 140 }}
          options={[
            { value: "hybrid", label: "混合搜索" },
            { value: "fts", label: "全文搜索" },
          ]}
        />
      </FilterBar>

      <ContentCard noPadding>
        <Tabs
          items={[
            {
              key: "list",
              label: "文档列表",
              children: (
                <Table
                  rowKey="id"
                  loading={isLoading && !searchQ}
                  columns={docColumns}
                  dataSource={searchQ ? [] : data?.items}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: data?.total,
                    onChange: setPage,
                    showTotal: (t) => `共 ${t} 条`,
                    showSizeChanger: false,
                  }}
                />
              ),
            },
            {
              key: "search",
              label: "搜索结果",
              children: (
                <Table
                  rowKey="id"
                  loading={searchLoading}
                  columns={searchColumns}
                  dataSource={searchQ ? searchResults : []}
                  locale={{ emptyText: searchQ ? "无匹配结果" : "请输入搜索关键词" }}
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </ContentCard>

      <Modal
        title={editing ? "编辑文档" : "新建文档"}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="如：安全规范、操作手册" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入后回车添加标签" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={10} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
