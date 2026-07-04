import { useQuery } from "@tanstack/react-query";
import { Button, Input, Select, Space, Table, Tag } from "antd";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import {
  INSTRUMENT_STATUS_LABELS,
  instrumentsApi,
  type Instrument,
  type InstrumentStatus,
} from "../api/instrumentsApi";
import { InstrumentForm } from "./InstrumentForm";

const STATUS_OPTIONS = Object.entries(INSTRUMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function InstrumentList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [labId, setLabId] = useState<string>();
  const [category, setCategory] = useState<string>();
  const [status, setStatus] = useState<InstrumentStatus>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["instruments", page, keyword, labId, category, status],
    queryFn: () =>
      instrumentsApi.list({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        lab_id: labId,
        category: category || undefined,
        status,
      }),
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const columns = [
    { title: "编号", dataIndex: "code", width: 120 },
    { title: "名称", dataIndex: "name", ellipsis: true },
    { title: "型号", dataIndex: "model", width: 120, render: (v: string) => v || "-" },
    { title: "分类", dataIndex: "category", width: 100, render: (v: string) => v || "-" },
    { title: "实验室", dataIndex: "lab_name", width: 140, render: (v: string) => v || "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (s: InstrumentStatus) => (
        <Tag>{INSTRUMENT_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "操作",
      width: 80,
      render: (_: unknown, record: Instrument) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setEditing(record);
            setFormOpen(true);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索名称或编号"
          allowClear
          onSearch={setKeyword}
          style={{ width: 220 }}
        />
        <Select
          placeholder="实验室"
          allowClear
          options={labOptions}
          style={{ width: 160 }}
          onChange={setLabId}
        />
        <Input
          placeholder="分类"
          allowClear
          style={{ width: 120 }}
          onChange={(e) => setCategory(e.target.value || undefined)}
        />
        <Select
          placeholder="状态"
          allowClear
          options={STATUS_OPTIONS}
          style={{ width: 120 }}
          onChange={setStatus}
        />
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          新增仪器
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

      <InstrumentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        editing={editing}
      />
    </div>
  );
}
