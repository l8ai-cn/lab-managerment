import { useQuery } from "@tanstack/react-query";
import { Button, Input, Select, Space, Table, Tag, Upload, message } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { labsApi, spacesApi } from "../api/labsApi";
import {
  LAB_TYPE_LABELS,
  OPEN_STATUS_COLORS,
  OPEN_STATUS_LABELS,
  type Lab,
  type LabType,
  type OpenStatus,
} from "../types/lab";

const LAB_TYPE_OPTIONS = Object.entries(LAB_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const OPEN_STATUS_OPTIONS = Object.entries(OPEN_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function LabList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [buildingId, setBuildingId] = useState<string>();
  const [floorId, setFloorId] = useState<string>();
  const [labType, setLabType] = useState<LabType>();
  const [openStatus, setOpenStatus] = useState<OpenStatus>();

  const { data: tree } = useQuery({
    queryKey: ["building-tree"],
    queryFn: spacesApi.getTree,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["labs", page, keyword, buildingId, floorId, labType, openStatus],
    queryFn: () =>
      labsApi.list({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        building_id: buildingId,
        floor_id: floorId,
        lab_type: labType,
        open_status: openStatus,
      }),
  });

  const handleExport = async () => {
    const blob = await labsApi.export();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "labs_export.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "编号",
      dataIndex: "code",
      width: 140,
      render: (code: string, record: Lab) => <Link to={`/labs/${record.id}`}>{code}</Link>,
    },
    { title: "名称", dataIndex: "name", ellipsis: true },
    {
      title: "位置",
      key: "location",
      ellipsis: true,
      render: (_: unknown, record: Lab) =>
        [record.building_name, record.floor_name, record.room_name].filter(Boolean).join(" / ") || "-",
    },
    {
      title: "类型",
      dataIndex: "lab_type",
      width: 120,
      render: (v: LabType | undefined) => (v ? LAB_TYPE_LABELS[v] : "-"),
    },
    {
      title: "开放状态",
      dataIndex: "open_status",
      width: 100,
      render: (status: OpenStatus) => (
        <Tag color={OPEN_STATUS_COLORS[status]}>{OPEN_STATUS_LABELS[status]}</Tag>
      ),
    },
    { title: "容纳人数", dataIndex: "capacity", width: 90, render: (v: number | undefined) => v ?? "-" },
    {
      title: "面积(㎡)",
      dataIndex: "area_sqm",
      width: 90,
      render: (v: number | undefined) => v ?? "-",
    },
  ];

  const buildingOptions = tree?.map((b) => ({ value: b.id, label: b.name })) ?? [];
  const floorOptions =
    tree
      ?.find((b) => b.id === buildingId)
      ?.floors.map((f) => ({ value: f.id, label: f.name })) ?? [];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索编号或名称"
          allowClear
          onSearch={setKeyword}
          style={{ width: 220 }}
        />
        <Select
          placeholder="楼栋"
          allowClear
          options={buildingOptions}
          style={{ width: 140 }}
          onChange={(v) => {
            setBuildingId(v);
            setFloorId(undefined);
          }}
        />
        <Select
          placeholder="楼层"
          allowClear
          options={floorOptions}
          style={{ width: 120 }}
          disabled={!buildingId}
          value={floorId}
          onChange={setFloorId}
        />
        <Select
          placeholder="实验室类型"
          allowClear
          options={LAB_TYPE_OPTIONS}
          style={{ width: 140 }}
          onChange={setLabType}
        />
        <Select
          placeholder="开放状态"
          allowClear
          options={OPEN_STATUS_OPTIONS}
          style={{ width: 120 }}
          onChange={setOpenStatus}
        />
        <Link to="/labs/new">
          <Button type="primary">新建实验室</Button>
        </Link>
        <Button onClick={handleExport}>导出 Excel</Button>
        <Upload
          accept=".xlsx,.xls"
          showUploadList={false}
          customRequest={async ({ file, onSuccess, onError }) => {
            try {
              const result = await labsApi.import(file as File);
              message.success(`导入完成：成功 ${result.success_count} 条，失败 ${result.error_count} 条`);
              if (result.errors.length) {
                message.warning(result.errors.slice(0, 3).join("；"));
              }
              refetch();
              onSuccess?.(result);
            } catch {
              message.error("导入失败");
              onError?.(new Error("import failed"));
            }
          }}
        >
          <Button>导入 Excel</Button>
        </Upload>
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
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
}
