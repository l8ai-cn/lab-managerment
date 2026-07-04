import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Loader2, ChevronLeft, ChevronRight, X, AlertCircle, Calendar } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

// Calendar Slots config
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "待审批",
  approved: "已批准",
  rejected: "已驳回",
  cancelled: "已取消",
};

interface Booking {
  id: string;
  instrument_name: string;
  applicant_name: string;
  purpose: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface ListResponse {
  items: Booking[];
  total: number;
}

interface InstrumentOption {
  id: string;
  name: string;
}

/**
 * 100% Brand-new Written InstrumentBookingListPage (Cal.com list & approvals grid)
 * Strictly zero AntD, uses custom layouts and tokens
 */
export function InstrumentBookingListPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formValues, setFormValues] = useState({
    instrument_id: "",
    purpose: "",
    start_time: "",
    end_time: "",
  });

  const queryClient = useQueryClient();

  // Query instrument options for selection
  const { data: instruments } = useQuery<InstrumentOption[]>({
    queryKey: ["instrument-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/instruments?page_size=100");
      return res.data.items || [];
    },
  });

  // Query Bookings matching our API specs
  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["instrument-bookings", page],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/instruments/bookings?page=${page}&page_size=10`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      await axios.post("/api/v1/instruments/bookings", payload);
    },
    onSuccess: () => {
      setModalOpen(false);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存预定申请");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/instruments/bookings/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/instruments/bookings/${id}/reject`, { comment: "拒绝" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instrument-bookings"] });
    },
  });

  const handleOpenNew = () => {
    setFormValues({
      instrument_id: "",
      purpose: "",
      start_time: "",
      end_time: "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.instrument_id || !formValues.start_time || !formValues.end_time) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="仪器预约" 
        subtitle="精密贵重仪器空闲时段选择、在线提审及现场扫码准入审批"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            快速预约
          </button>
        }
      />

      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-44">预约时段</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">预约设备</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">申请人 / 目的</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">状态</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入调度序列...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                    暂无任何仪器预定申请
                  </td>
                </tr>
              ) : (
                data.items.map((record) => {
                  let railClass = "status-rail--offline";
                  if (record.status === "approved") railClass = "status-rail--ready";
                  if (record.status === "pending") railClass = "status-rail--pending";
                  if (record.status === "rejected") railClass = "status-rail--fault";

                  return (
                    <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                      <td className={`px-6 py-3.5 status-rail ${railClass} font-mono text-[var(--ink-secondary)] text-xs`}>
                        <div className="font-semibold text-[var(--ink-primary)]">
                          {new Date(record.start_time).toLocaleDateString("zh-CN")}
                        </div>
                        <div className="text-[10px] text-[var(--ink-tertiary)] mt-0.5">
                          {new Date(record.start_time).toLocaleTimeString("zh-CN", {hour: "2-digit", minute:"2-digit"})} - {new Date(record.end_time).toLocaleTimeString("zh-CN", {hour: "2-digit", minute:"2-digit"})}
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-[var(--ink-primary)]">
                        {record.instrument_name}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                        <div>申请人: {record.applicant_name || "教工"}</div>
                        <div className="text-[10px] text-[var(--ink-tertiary)] mt-0.5">用途: {record.purpose}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                          record.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          record.status === "pending" ? "bg-blue-50 text-blue-700" :
                          record.status === "rejected" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>
                          {BOOKING_STATUS_LABELS[record.status]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                        {record.status === "pending" && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate(record.id)}
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none p-0"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(record.id)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
                            >
                              驳回
                            </button>
                          </>
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
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 条申请记录
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
                提交仪器预约
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
                  预约目标精密仪器 *
                </label>
                <select
                  value={formValues.instrument_id}
                  onChange={(e) => setFormValues({ ...formValues, instrument_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                >
                  <option value="">请选择设备...</option>
                  {instruments?.map((ins) => (
                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  预定目的用途 *
                </label>
                <input
                  type="text"
                  placeholder="如：半导体电学特性参数扫描"
                  value={formValues.purpose}
                  onChange={(e) => setFormValues({ ...formValues, purpose: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    开始时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formValues.start_time}
                    onChange={(e) => setFormValues({ ...formValues, start_time: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    结束时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formValues.end_time}
                    onChange={(e) => setFormValues({ ...formValues, end_time: e.target.value })}
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
                  确认预约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default InstrumentBookingListPage;
