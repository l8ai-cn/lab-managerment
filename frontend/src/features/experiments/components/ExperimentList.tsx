import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { experimentsApi } from "../api/experimentsApi";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type Experiment,
  type ExperimentStatus,
} from "../types/experiment";

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ExperimentList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus[]>([]);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: experimentsApi.delete,
    onSuccess: () => {
      message.success("已删除");
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["experiments", page, keyword, statusFilter],
    queryFn: () =>
      experimentsApi.list({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        status: statusFilter.length ? statusFilter : undefined,
      }),
  });

  const columns = [
    {
      title: "编号",
      dataIndex: "code",
      width: 140,
      render: (code: string, record: Experiment) => (
        <Link to={`/experiments/${record.id}`}>{code}</Link>
      ),
    },
    { title: "标题", dataIndex: "title", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status: ExperimentStatus) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: "计划开始",
      dataIndex: "planned_start",
      width: 180,
      render: (v: string | undefined) => (v ? new Date(v).toLocaleString("zh-CN") : "-"),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 140,
      render: (_: unknown, record: Experiment) => (
        <Space size="small">
          <Link to={`/experiments/${record.id}/edit`}>
            <Button type="link" size="small">
              编辑
            </Button>
          </Link>
          {record.status === "draft" && (
            <Popconfirm title="确认删除？" onConfirm={() => deleteMutation.mutate(record.id)}>
              <Button type="link" danger size="small">
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Link to="/experiments/new">
            <Button type="primary" icon={<PlusOutlined />}>
              新建实验
            </Button>
          </Link>
        }
      />

      <FilterBar>
        <Input.Search
          placeholder="搜索编号或标题"
          allowClear
          onSearch={setKeyword}
          style={{ width: 260 }}
        />
        <Select
          mode="multiple"
          placeholder="筛选状态"
          allowClear
          options={STATUS_OPTIONS}
          style={{ minWidth: 200 }}
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
            showTotal: (total) => `共 ${total} 条`,
            showSizeChanger: false,
          }}
        />
      </ContentCard>
    </>
  );
}
