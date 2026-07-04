import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { 
  Plus, 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle 
} from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

// Lab state status mappings
export const LAB_TYPE_LABELS: Record<string, string> = {
  chemistry: "化学类",
  physics: "物理类",
  biology: "生物类",
  computer: "计算机/信息类",
  engineering: "工程类",
  other: "其他",
};

export const OPEN_STATUS_LABELS: Record<string, string> = {
  open: "开放中",
  closed: "已关闭",
  maintenance: "维护中",
};

interface Lab {
  id: string;
  name: string;
  code: string;
  lab_type: string;
  open_status: string;
  capacity: number;
  area: number;
  manager_name?: string;
  building_name?: string;
  room_name?: string;
}

interface ListResponse {
  items: Lab[];
  total: number;
}

export function LabListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [labType, setLabType] = useState("");
  const [openStatus, setOpenStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<Lab | null>(null);

  const [formValues, setFormValues] = useState({
    code: "",
    name: "",
    lab_type: "chemistry",
    open_status: "open",
    capacity: 30,
    area: 120,
  });

  const queryClient = useQueryClient();

  // Query labs lists matching our API specs
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["labs", page, keyword, labType, openStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      if (labType) params.append("lab_type", labType);
      if (openStatus) params.append("open_status", openStatus);

      const res = await axios.get(`/api/v1/labs?${params.toString()}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      if (editing) {
        await axios.patch(`/api/v1/labs/${editing.id}`, payload);
      } else {
        await axios.post("/api/v1/labs", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["labs"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存实验室配置");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/labs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
    },
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormValues({
      code: "",
      name: "",
      lab_type: "chemistry",
      open_status: "open",
      capacity: 30,
      area: 120,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (lab: Lab) => {
    setEditing(lab);
    setFormValues({
      code: lab.code,
      name: lab.name,
      lab_type: lab.lab_type,
      open_status: lab.open_status,
      capacity: lab.capacity || 30,
      area: lab.area || 120,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.code || !formValues.name) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="实验室" 
        subtitle="高校实验分室与安全系数基础台账配置"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新建分室
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="搜索名称、房间号..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="block w-64 pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            />
          </div>

          <select
            value={labType}
            onChange={(e) => { setLabType(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">所有实验室类型</option>
            {Object.entries(LAB_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <select
            value={openStatus}
            onChange={(e) => { setOpenStatus(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">所有开放状态</option>
            {Object.entries(OPEN_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Table with Status Rail */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">房间编号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">实验室名称</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">类型</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">面积 / 容量</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">状态</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入实验室资源...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    未找到匹配的实验室数据
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  let railClass = "status-rail--offline";
                  if (record.open_status === "open") railClass = "status-rail--ready";
                  if (record.open_status === "maintenance") railClass = "status-rail--maintenance";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className={`px-6 py-3.5 status-rail ${railClass} font-mono font-medium text-[var(--ink-primary)] text-xs`}>
                        {record.code}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-[var(--ink-primary)] block truncate max-w-xs">{record.name}</span>
                        {record.building_name && (
                          <span className="text-[10px] text-[var(--ink-tertiary)] block mt-0.5">{record.building_name} {record.room_name}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                        {LAB_TYPE_LABELS[record.lab_type] || "-"}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono tabular-nums">
                        {record.area ?? 0}㎡ / {record.capacity ?? 0} 人
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.open_status === "open" ? "bg-emerald-50 text-emerald-700" :
                          record.open_status === "maintenance" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>
                          {OPEN_STATUS_LABELS[record.open_status]}
                        </span>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 个实验室
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

      {/* Modal Overlay Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">
                {editing ? "编辑实验分室" : "创建实验分室"}
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
                  实验室编号 *
                </label>
                <input
                  type="text"
                  placeholder="如：CHEM-101"
                  disabled={!!editing}
                  value={formValues.code}
                  onChange={(e) => setFormValues({ ...formValues, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  实验室名称 *
                </label>
                <input
                  type="text"
                  placeholder="如：基础有机化学物理实验室"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    功能类型
                  </label>
                  <select
                    value={formValues.lab_type}
                    onChange={(e) => setFormValues({ ...formValues, lab_type: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                  >
                    {Object.entries(LAB_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    开放状态
                  </label>
                  <select
                    value={formValues.open_status}
                    onChange={(e) => setFormValues({ ...formValues, open_status: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                  >
                    {Object.entries(OPEN_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    容纳人数 (capacity)
                  </label>
                  <input
                    type="number"
                    value={formValues.capacity}
                    onChange={(e) => setFormValues({ ...formValues, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    建筑面积 (㎡)
                  </label>
                  <input
                    type="number"
                    value={formValues.area}
                    onChange={(e) => setFormValues({ ...formValues, area: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>
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
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
