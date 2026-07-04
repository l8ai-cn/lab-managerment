import { DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Popconfirm, Select, Table, Tag, Upload, message } from "antd";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  instrumentsApi,
  INSTRUMENT_STATUS_COLORS,
  INSTRUMENT_STATUS_LABELS,
  type Instrument,
  type InstrumentStatus,
} from "../api/instrumentsApi";
import { InstrumentForm } from "./InstrumentForm";

const STATUS_OPTIONS = Object.entries(INSTRUMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function InstrumentList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [labId, setLabId] = useState<string>();
  const [status, setStatus] = useState<InstrumentStatus>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);
  const [statusModal, setStatusModal] = useState<Instrument | null>(null);
  const [newStatus, setNewStatus] = useState<InstrumentStatus>("normal");
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: instrumentsApi.delete,
    onSuccess: () => {
      message.success("已删除");
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InstrumentStatus }) =>
      instrumentsApi.changeStatus(id, status),
    onSuccess: () => {
      message.success("状态已更新");
      setStatusModal(null);
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => instrumentsApi.import(file),
    onSuccess: (result) => {
      message.success(`已导入 ${result.imported} 条`);
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
    onError: () => message.error("导入失败"),
  });

  const exportMutation = useMutation({
    mutationFn: () => instrumentsApi.export({ lab_id: labId }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "instruments.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      message.success("导出成功");
    },
  });

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

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record: Instrument) => {
    setEditing(record);
    setFormOpen(true);
  };

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
    {
      title: "操作",
      width: 200,
      render: (_: unknown, record: Instrument) => (
        <>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => { setStatusModal(record); setNewStatus(record.status); }}>
            状态
          </Button>
          <Popconfirm title="确认删除该仪器？" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增仪器
            </Button>
          </>
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
            showSizeChanger: false,
          }}
        />
      </ContentCard>

      <InstrumentForm
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <Modal
        title={`变更状态 — ${statusModal?.name ?? ""}`}
        open={!!statusModal}
        onCancel={() => setStatusModal(null)}
        onOk={() => statusModal && statusMutation.mutate({ id: statusModal.id, status: newStatus })}
        confirmLoading={statusMutation.isPending}
      >
        <Select
          style={{ width: "100%" }}
          value={newStatus}
          onChange={setNewStatus}
          options={STATUS_OPTIONS}
        />
      </Modal>
    </>
  );
}
