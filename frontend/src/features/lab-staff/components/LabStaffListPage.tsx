import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

interface LabStaff {
  id: string;
  name: string;
  employee_no: string;
  phone: string | null;
  office_location: string | null;
}

interface ListResponse {
  items: LabStaff[];
  total: number;
}

export function LabStaffListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<LabStaff | null>(null);

  const [formValues, setFormValues] = useState({
    employee_no: "",
    name: "",
    phone: "",
    office_location: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["lab-staff", page, keyword],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      const res = await axios.get(`/api/v1/lab-staff?${params.toString()}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      if (editing) {
        await axios.patch(`/api/v1/lab-staff/${editing.id}`, payload);
      } else {
        await axios.post("/api/v1/lab-staff", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["lab-staff"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存实验员技术指标");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/lab-staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-staff"] });
    },
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormValues({
      employee_no: "",
      name: "",
      phone: "",
      office_location: "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (staff: LabStaff) => {
    setEditing(staff);
    setFormValues({
      employee_no: staff.employee_no,
      name: staff.name,
      phone: staff.phone || "",
      office_location: staff.office_location || "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.employee_no || !formValues.name) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="实验员" 
        subtitle="负责本校各大型精密仪器的常驻技术管理人员"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            分配人员
          </button>
        }
      />

      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
        <div className="relative max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="搜索教工工号、姓名..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="block w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none"
          />
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-32">教工工号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">姓名</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">联系电话</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">办公室地点</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入技术员台账...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    未分配任何实验技术员
                  </td>
                </tr>
              ) : (
                data.items.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                    <td className="px-6 py-3.5 text-xs font-mono font-medium text-[var(--ink-primary)]">
                      {record.employee_no}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-[var(--ink-primary)]">{record.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono">
                      {record.phone || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                      {record.office_location || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(record)}
                        className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer bg-transparent border-none p-0"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(record.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
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

        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 名实验员
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
                {editing ? "编辑实验员参数" : "指派实验员"}
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
                  教工工号 *
                </label>
                <input
                  type="text"
                  placeholder="如：EMP-202501"
                  disabled={!!editing}
                  value={formValues.employee_no}
                  onChange={(e) => setFormValues({ ...formValues, employee_no: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  姓名 *
                </label>
                <input
                  type="text"
                  placeholder="如：张技术员"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  联系电话
                </label>
                <input
                  type="text"
                  placeholder="如：13800000000"
                  value={formValues.phone}
                  onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  办公室物理地点
                </label>
                <input
                  type="text"
                  placeholder="如：物理大楼 301B"
                  value={formValues.office_location}
                  onChange={(e) => setFormValues({ ...formValues, office_location: e.target.value })}
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
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
