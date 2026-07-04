import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Search, Loader2, GraduationCap, X, Check, AlertCircle } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  department: string | null;
  major: string | null;
}

interface CourseCreate {
  code: string;
  name: string;
  department?: string;
  major?: string;
}

interface ListResponse {
  items: Course[];
  total: number;
}

export function CourseListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [formValues, setFormValues] = useState<CourseCreate>({
    code: "",
    name: "",
    department: "",
    major: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["courses", page, keyword],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      const res = await axios.get(`/api/v1/courses?${params.toString()}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: CourseCreate) => {
      if (editing) {
        await axios.patch(`/api/v1/courses/${editing.id}`, payload);
      } else {
        await axios.post("/api/v1/courses", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setErrorMessage("");
      setFormValues({ code: "", name: "", department: "", major: "" });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-options"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存课程");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["courses-options"] });
    },
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormValues({ code: "", name: "", department: "", major: "" });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditing(course);
    setFormValues({
      code: course.code,
      name: course.name,
      department: course.department || "",
      major: course.major || "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.code || !formValues.name) {
      setErrorMessage("请填写必填项 (*)");
      return;
    }
    setErrorMessage("");
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold tracking-tight">课程管理</h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">管理系统内设教学班级、大纲专业与归属院系</p>
        </div>
        
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          新建课程
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
        <div className="relative max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="搜索课程代码、名称..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="block w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
          />
        </div>
      </div>

      {/* Modern High-density Data Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-32">课程代码</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">课程名称</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">归属院系</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">专业方向</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入课程台账...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                    未找到匹配的课程大纲数据
                  </td>
                </tr>
              ) : (
                data.items.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors group">
                    <td className="px-6 py-3.5 text-xs font-mono font-medium text-[var(--ink-primary)]">
                      {record.code}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-medium text-[var(--ink-primary)] block truncate max-w-xs">{record.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                      {record.department || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                      {record.major || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(record)}
                        className="text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer bg-transparent border-none p-0"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(record.id)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog (Stripe Overlay Style) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">
                {editing ? "编辑大纲课程" : "创建全新课程"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/10 rounded-[var(--radius-sm)] text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  课程代码 *
                </label>
                <input
                  type="text"
                  placeholder="如：PHY101"
                  disabled={!!editing}
                  value={formValues.code}
                  onChange={(e) => setFormValues({ ...formValues, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  课程名称 *
                </label>
                <input
                  type="text"
                  placeholder="如：大学物理实验（一）"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    归属院系
                  </label>
                  <input
                    type="text"
                    placeholder="如：物理学院"
                    value={formValues.department || ""}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    专业方向
                  </label>
                  <input
                    type="text"
                    placeholder="如：应用物理学"
                    value={formValues.major || ""}
                    onChange={(e) => setFormValues({ ...formValues, major: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
                >
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  保存课程
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
