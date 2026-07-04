import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, Select, Table, Tag } from "antd";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { instrumentsApi, INSTRUMENT_STATUS_COLORS, INSTRUMENT_STATUS_LABELS, type InstrumentStatus } from "../api/instrumentsApi";
import { InstrumentForm } from "./InstrumentForm";

const STATUS_OPTIONS = Object.entries(INSTRUMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function InstrumentList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [labId, setLabId] = useState<string>();
  const [status, setStatus] = useState<InstrumentStatus>();
  const [formOpen, setFormOpen] = useState(false);

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["instruments", page, keyword, labId, status],
    queryFn: () =>
      instrumentsApi.list({
        page,
        keyword: keyword || undefined,
        lab_id: labId,
        status,
      }),
  });

  const labOptions = labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const columns = [
    { title: "编号", dataIndex: "code", width: 130 },
    { title: "名称", dataIndex: "name", ellipsis: true },
    { title: "型号", dataIndex: "model", width: 120, render: (v: string) => v || "-" },
    { title: "分类", dataIndex: "category", width: 100, render: (v: string) => v || "-" },
    { title: "实验室", dataIndex: "lab_name", width: 140, render: (v: string) => v || "-" },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (s: InstrumentStatus) => (
        <Tag color={INSTRUMENT_STATUS_COLORS[s]}>{INSTRUMENT_STATUS_LABELS[s]}</Tag>
      ),
    },
    {
      title: "购置价格",
      dataIndex: "purchase_price",
      width: 110,
      render: (v: number) => (v ? `¥${v.toLocaleString()}` : "-"),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            新增仪器
          </Button>
        }
      />

      <FilterBar>
        <Input.Search placeholder="搜索仪器" allowClear onSearch={setKeyword} style={{ width: 240 }} />
        <Select placeholder="所属实验室" allowClear options={labOptions} style={{ width: 200 }} onChange={setLabId} />
        <Select placeholder="状态" allowClear options={STATUS_OPTIONS} style={{ width: 120 }} onChange={setStatus} />
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
          }}
        />
      </ContentCard>

      <InstrumentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
