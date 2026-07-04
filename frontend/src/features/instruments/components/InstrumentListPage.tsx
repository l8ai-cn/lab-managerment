import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

export const INSTRUMENT_STATUS_LABELS: Record<string, string> = {
  normal: "正常使用",
  repairing: "维修中",
  decommissioned: "已停用",
  scrapped: "报废",
};

interface Instrument {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  serial_no: string;
  asset_no: string;
  purchase_price: number;
  status: string;
  manager_name?: string;
  lab_name?: string;
}

interface ListResponse {
  items: Instrument[];
  total: number;
}

export function InstrumentListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<Instrument | null>(null);

  const [formValues, setFormValues] = useState({
    asset_no: "",
    name: "",
    model: "",
    manufacturer: "",
    serial_no: "",
    purchase_price: 15000,
    status: "normal",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["instruments", page, keyword, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      if (statusFilter) params.append("status", statusFilter);

      const res = await axios.get(`/api/v1/instruments?${params.toString()}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      if (editing) {
        await axios.patch(`/api/v1/instruments/${editing.id}`, payload);
      } else {
        await axios.post("/api/v1/instruments", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存设备参数配置");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/v1/instruments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    },
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormValues({
      asset_no: "",
      name: "",
      model: "",
      manufacturer: "",
      serial_no: "",
      purchase_price: 15000,
      status: "normal",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (ins: Instrument) => {
    setEditing(ins);
    setFormValues({
      asset_no: ins.asset_no,
      name: ins.name,
      model: ins.model,
      manufacturer: ins.manufacturer,
      serial_no: ins.serial_no,
      purchase_price: ins.purchase_price || 15000,
      status: ins.status,
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.asset_no || !formValues.name) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="仪器台账" 
        subtitle="精密仪器资产编号对账、运行状态调整及预约规则前置控制"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新增设备
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
              placeholder="搜索资产号、型号、名称..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="block w-64 pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none focus:border-[var(--brand)]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">所有技术状态</option>
            {Object.entries(INSTRUMENT_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data table with Instrument Status Rail */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">资产编号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">仪器名称 / 型号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">技术参数</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">资产原值</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">状态</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入资产台账...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    未录入任何仪器设备资产
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  let railClass = "status-rail--offline";
                  if (record.status === "normal") railClass = "status-rail--ready";
                  if (record.status === "repairing") railClass = "status-rail--fault";
                  if (record.status === "decommissioned") railClass = "status-rail--maintenance";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className={`px-6 py-3.5 status-rail ${railClass} font-mono font-medium text-[var(--ink-primary)] text-xs`}>
                        {record.asset_no}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-sm font-semibold text-[var(--ink-primary)] block truncate max-w-xs">{record.name}</span>
                        {record.model && (
                          <span className="text-[10px] text-[var(--ink-tertiary)] block mt-0.5 font-mono">{record.model}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                        <div>厂家: {record.manufacturer || "-"}</div>
                        <div className="mt-0.5 text-[10px] font-mono text-[var(--ink-tertiary)]">S/N: {record.serial_no || "-"}</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono tabular-nums">
                        ¥{record.purchase_price ? record.purchase_price.toLocaleString("zh-CN") : "0"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.status === "normal" ? "bg-emerald-50 text-emerald-700" :
                          record.status === "repairing" ? "bg-rose-50 text-rose-700 animate-pulse" :
                          record.status === "decommissioned" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>
                          {INSTRUMENT_STATUS_LABELS[record.status]}
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
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 台设备仪器
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
                {editing ? "编辑精密设备台账" : "登记精密设备"}
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
                  资产对账编号 *
                </label>
                <input
                  type="text"
                  placeholder="如：INS-PCR-2025"
                  disabled={!!editing}
                  value={formValues.asset_no}
                  onChange={(e) => setFormValues({ ...formValues, asset_no: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  精密仪器名称 *
                </label>
                <input
                  type="text"
                  placeholder="如：场发射扫描电子显微镜"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    规格型号
                  </label>
                  <input
                    type="text"
                    placeholder="如：SU8010"
                    value={formValues.model}
                    onChange={(e) => setFormValues({ ...formValues, model: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    生产厂家
                  </label>
                  <input
                    type="text"
                    placeholder="如：Hitachi"
                    value={formValues.manufacturer}
                    onChange={(e) => setFormValues({ ...formValues, manufacturer: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    出厂编号 S/N
                  </label>
                  <input
                    type="text"
                    placeholder="S/N"
                    value={formValues.serial_no}
                    onChange={(e) => setFormValues({ ...formValues, serial_no: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    购买单价 (元)
                  </label>
                  <input
                    type="number"
                    value={formValues.purchase_price}
                    onChange={(e) => setFormValues({ ...formValues, purchase_price: Number(e.target.value) })}
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
                  确认登记
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
