import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FileSpreadsheet, 
  Copy, 
  Plus, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Microscope,
  RotateCcw
} from "lucide-react";

// Project Type labels on frontend
export const PROJECT_TYPE_LABELS = {
  verification: "验证性",
  design: "设计性",
  comprehensive: "综合性",
};

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Project {
  id: string;
  name: string;
  course_id?: string;
  course_code?: string;
  course_name?: string;
  type: "verification" | "design" | "comprehensive";
  hours: number;
  semester: string;
  updated_at: string;
}

interface ListResponse {
  items: Project[];
  total: number;
}

export function ProjectList() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [copyOpen, setCopyOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState("");
  
  const queryClient = useQueryClient();

  // List courses for selector
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["courses-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses?page_size=100");
      return res.data.items || [];
    },
  });

  // List projects
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["experiment-projects", page, keyword, courseId, projectType],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      if (courseId) params.append("course_id", courseId);
      if (projectType) params.append("project_type", projectType);

      const res = await axios.get(`/api/v1/experiment-projects?${params.toString()}`);
      return res.data;
    },
  });

  // Delete project
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/experiment-projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
    },
  });

  // Export projects
  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get("/api/v1/experiment-projects/export", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `experiment_projects_${new Date().toISOString().slice(0,10).replace(/-/g, "")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  // Bulk copy to another course
  const copyMutation = useMutation({
    mutationFn: async () => {
      await axios.post("/api/v1/experiment-projects/batch-copy", {
        source_ids: selectedRowKeys,
        target_course_id: targetCourseId,
      });
    },
    onSuccess: () => {
      setSelectedRowKeys([]);
      setCopyOpen(false);
      setTargetCourseId("");
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.items) {
      setSelectedRowKeys(data.items.map((i) => i.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowKeys((prev) => [...prev, id]);
    } else {
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold tracking-tight">实验项目</h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">课程实验项目与大纲指标管理</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-primary)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exportMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            导出
          </button>

          <button
            onClick={() => setCopyOpen(true)}
            disabled={selectedRowKeys.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            批量复制 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </button>

          <Link 
            to="/experiment-projects/new" 
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            新建项目
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 flex flex-wrap items-center justify-between gap-3 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="搜索项目名称..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="block w-64 pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <select
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)] focus:bg-[var(--surface)]"
          >
            <option value="">所有关联课程</option>
            {courses?.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.code} {opt.name}</option>
            ))}
          </select>

          <select
            value={projectType}
            onChange={(e) => { setProjectType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)] focus:bg-[var(--surface)]"
          >
            <option value="">所有项目类型</option>
            {Object.entries(PROJECT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {(keyword || courseId || projectType) && (
          <button
            onClick={() => { setKeyword(""); setCourseId(""); setProjectType(""); setPage(1); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--brand)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置筛选
          </button>
        )}
      </div>

      {/* Data Grid Table with Instrument Status Rail (Our Signature Element) */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={data?.items?.length ? selectedRowKeys.length === data.items.length : false}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--brand)] focus:ring-[var(--focus-ring)] cursor-pointer"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">项目名称 / 指标</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">关联课程</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">项目类型</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">计划学时</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">推荐学期</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入大纲指标...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Microscope className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                    未找到匹配的大纲项目数据
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  // Map types to semantic colors for Status Rail
                  let railClass = "status-rail--offline";
                  if (record.type === "comprehensive") railClass = "status-rail--ready";
                  if (record.type === "design") railClass = "status-rail--pending";
                  if (record.type === "verification") railClass = "status-rail--maintenance";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors group">
                      {/* Leftmost cell contains signature 3px Instrument Status Rail */}
                      <td className={`px-6 py-3.5 status-rail ${railClass}`}>
                        <input
                          type="checkbox"
                          checked={selectedRowKeys.includes(record.id)}
                          onChange={(e) => handleSelectRow(record.id, e.target.checked)}
                          className="h-4 w-4 rounded border-[var(--border-default)] text-[var(--brand)] focus:ring-[var(--focus-ring)] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-medium text-[var(--ink-primary)] block truncate max-w-xs">{record.name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-xs text-[var(--ink-secondary)]">
                          {record.course_code ? (
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-[var(--ink-tertiary)]" />
                              {record.course_code} {record.course_name}
                            </span>
                          ) : "-"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${
                          record.type === "comprehensive" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" :
                          record.type === "design" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}>
                          {PROJECT_TYPE_LABELS[record.type]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono tabular-nums">
                        {record.hours ?? "-"}h
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                        {record.semester || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                        <Link 
                          to={`/experiment-projects/${record.id}/edit`} 
                          className="text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => deleteMutation.mutate(record.id)}
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 条记录
            </span>
            <div className="inline-flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一页
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                下一页
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Copy Modal */}
      {copyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-[var(--shadow-md)] animate-scale-in">
            <h3 className="text-base font-semibold text-[var(--ink-primary)]">批量复制实验项目</h3>
            <p className="text-xs text-[var(--ink-secondary)] mt-1.5">
              将选中的 {selectedRowKeys.length} 个实验大纲项目复制导入到指定的目的课程。
            </p>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[var(--text-label)] text-[var(--ink-secondary)] font-medium mb-1.5">
                  目的课程 *
                </label>
                <select
                  value={targetCourseId}
                  onChange={(e) => setTargetCourseId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer focus:border-[var(--brand)] focus:bg-[var(--surface)]"
                >
                  <option value="">请选择目的课程...</option>
                  {courses?.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => { setCopyOpen(false); setTargetCourseId(""); }}
                className="px-3.5 py-2 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => copyMutation.mutate()}
                disabled={!targetCourseId || copyMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer"
              >
                {copyMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                执行复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
