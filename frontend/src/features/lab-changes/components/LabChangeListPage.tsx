import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Loader2, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

// Change request statuses mapping per specs
export const CHANGE_STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  submitted: "待单位审核",
  approved: "已通过",
  rejected: "已驳回",
};

interface LabChange {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  applicant_name?: string;
  lab_name?: string;
}

interface ListResponse {
  items: LabChange[];
  total: number;
}

interface LabOption {
  id: string;
  name: string;
}

export function LabChangeListPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formValues, setFormValues] = useState({
    lab_id: "",
    title: "",
    description: "",
  });

  const queryClient = useQueryClient();

  // Query lab options for selection
  const { data: labs } = useQuery<LabOption[]>({
    queryKey: ["lab-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/labs?page_size=100");
      return res.data.items || [];
    },
  });

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["lab-changes", page],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/lab-changes?page=${page}&page_size=10`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      await axios.post("/api/v1/lab-changes", payload);
    },
    onSuccess: () => {
      setModalOpen(false);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["lab-changes"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存变更申请");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/lab-changes/${id}/submit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-changes"] });
    },
  });

  const handleOpenNew = () => {
    setFormValues({
      lab_id: "",
      title: "",
      description: "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.lab_id || !formValues.title) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="变更管理" 
        subtitle="变更在线申请、多级线上审核及变更留痕追溯"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新建申请
          </button>
        }
      />

      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">申报时间</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">变更主题</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">关联实验室</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">申请人</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">状态</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入变更流程...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    暂无任何变更申请记录
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  let railClass = "status-rail--offline";
                  if (record.status === "approved") railClass = "status-rail--ready";
                  if (record.status === "submitted") railClass = "status-rail--pending";
                  if (record.status === "draft") railClass = "status-rail--maintenance";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className={`px-6 py-3.5 status-rail ${railClass} font-mono text-[var(--ink-secondary)] text-xs`}>
                        {new Date(record.created_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-[var(--ink-primary)] block truncate max-w-xs">{record.title}</span>
                        {record.description && (
                          <span className="text-[10px] text-[var(--ink-tertiary)] block mt-0.5 truncate max-w-xs">{record.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                        {record.lab_name || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-medium">
                        {record.applicant_name || "系统分配"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          record.status === "submitted" ? "bg-blue-50 text-blue-700" :
                          record.status === "rejected" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>
                          {CHANGE_STATUS_LABELS[record.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                        {record.status === "draft" && (
                          <button
                            onClick={() => submitMutation.mutate(record.id)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none p-0"
                          >
                            提审
                          </button>
                        )}
                        <span className="text-[var(--ink-muted)] text-xs">详情待配</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 条变更记录
            </span>
            <div className="inline-flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一页
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                下一页
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popover overlay modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-sm w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">
                新建变更申请
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/10 rounded-[var(--radius-sm)] text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  关联目标分室 *
                </label>
                <select
                  value={formValues.lab_id}
                  onChange={(e) => setFormValues({ ...formValues, lab_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                >
                  <option value="">请选择实验室...</option>
                  {labs?.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  变更主题/标题 *
                </label>
                <input
                  type="text"
                  placeholder="如：物理化学实验室设备扩建增容申请"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  详细说明
                </label>
                <textarea
                  placeholder="请输入变更的具体细项，如仪器划归、功能区调整等..."
                  rows={3}
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
                >
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  起草申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
