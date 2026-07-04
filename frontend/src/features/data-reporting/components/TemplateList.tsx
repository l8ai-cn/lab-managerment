import { useQuery } from "@tanstack/react-query";
import { Input, Space, Table } from "antd";
import { useState } from "react";
import { dataReportingApi } from "../api/dataReportingApi";

export function TemplateList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report-templates", page, keyword],
    queryFn: () =>
      dataReportingApi.listTemplates({ page, page_size: 20, keyword: keyword || undefined }),
  });

  const columns = [
    { title: "模板编码", dataIndex: "code", width: 140 },
    { title: "模板名称", dataIndex: "name", ellipsis: true },
    { title: "说明", dataIndex: "description", ellipsis: true, render: (v: string) => v || "-" },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索模板"
          allowClear
          onSearch={setKeyword}
          style={{ width: 220 }}
        />
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
    </div>
  );
}
