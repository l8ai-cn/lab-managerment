import { CopyOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Space, Table, Upload, message } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  PROJECT_TYPE_LABELS,
  coursesApi,
  experimentProjectsApi,
  type ExperimentProject,
  type ProjectType,
} from "../api/experimentProjectsApi";
import { ProjectCopyModal } from "./ProjectForm";

const TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProjectList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [courseId, setCourseId] = useState<string>();
  const [projectType, setProjectType] = useState<ProjectType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [copyOpen, setCopyOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: coursesData } = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => coursesApi.list({ page_size: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["experiment-projects", page, keyword, courseId, projectType],
    queryFn: () =>
      experimentProjectsApi.list({
        page,
        page_size: 20,
        keyword: keyword || undefined,
        course_id: courseId,
        project_type: projectType,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: experimentProjectsApi.delete,
    onSuccess: () => {
      message.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => experimentProjectsApi.export({ course_id: courseId }),
    onSuccess: (blob) => {
      downloadBlob(blob, `experiment_projects_${dayjs().format("YYYYMMDD")}.xlsx`);
      message.success("导出成功");
    },
    onError: () => message.error("导出失败"),
  });

  const importMutation = useMutation({
    mutationFn: experimentProjectsApi.import,
    onSuccess: (result) => {
      message.success(`导入完成：成功 ${result.success_count} 条，失败 ${result.error_count} 条`);
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
    },
    onError: () => message.error("导入失败"),
  });

  const courseOptions =
    coursesData?.items.map((c) => ({ value: c.id, label: `${c.code} ${c.name}` })) ?? [];

  const columns = [
    { title: "项目名称", dataIndex: "name", ellipsis: true },
    {
      title: "课程",
      key: "course",
      width: 160,
      render: (_: unknown, record: ExperimentProject) =>
        record.course_code ? `${record.course_code} ${record.course_name}` : "-",
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 90,
      render: (v: ProjectType) => PROJECT_TYPE_LABELS[v],
    },
    { title: "学时", dataIndex: "hours", width: 70, render: (v: number) => v ?? "-" },
    { title: "学期", dataIndex: "semester", width: 120, render: (v: string) => v || "-" },
    {
      title: "操作",
      width: 120,
      render: (_: unknown, record: ExperimentProject) => (
        <Space size="small">
          <Link to={`/experiment-projects/${record.id}/edit`}>编辑</Link>
          <Button
            type="link"
            danger
            size="small"
            onClick={() => deleteMutation.mutate(record.id)}
          >
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
          <>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
            >
              导出
            </Button>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  await importMutation.mutateAsync(file as File);
                  onSuccess?.({});
                } catch {
                  onError?.(new Error("import failed"));
                }
              }}
            >
              <Button icon={<UploadOutlined />} loading={importMutation.isPending}>
                导入
              </Button>
            </Upload>
            <Button
              icon={<CopyOutlined />}
              disabled={!courseId}
              onClick={() => setCopyOpen(true)}
            >
              批量复制
            </Button>
            <Link to="/experiment-projects/new">
              <Button type="primary" icon={<PlusOutlined />}>
                新建项目
              </Button>
            </Link>
          </>
        }
      />

      <FilterBar>
        <Input.Search
          placeholder="搜索项目名称"
          allowClear
          onSearch={setKeyword}
          style={{ width: 220 }}
        />
        <Select
          placeholder="课程筛选"
          allowClear
          options={courseOptions}
          style={{ width: 180 }}
          onChange={setCourseId}
        />
        <Select
          placeholder="项目类型"
          allowClear
          options={TYPE_OPTIONS}
          style={{ width: 140 }}
          onChange={setProjectType}
        />
      </FilterBar>

      <ContentCard noPadding>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
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

      <ProjectCopyModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        selectedIds={selectedRowKeys}
        sourceCourseId={courseId}
      />
    </>
  );
}
