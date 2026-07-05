import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, Check, AlertCircle, HelpCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

interface PendingUsage {
  id: string; // booking_id
  item_name?: string;
  applicant_name?: string;
  start_time: string;
  end_time: string;
}

interface ListResponse {
  items: PendingUsage[];
}

/**
 * 100% Brand-new Written UsageApprovalPage (sweeping verification approvals)
 * Strictly zero AntD, uses custom high-density layouts and tokens
 */
export function UsageApprovalPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["pending-usage-approvals"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/lab-bookings/pending-usage?page_size=100");
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/lab-bookings/${id}/approve-usage`);
    },
    onSuccess: () => {
      setSuccessMessage("使用实绩核验无误，一键审批通过并记档！");
      queryClient.invalidateQueries({ queryKey: ["pending-usage-approvals"] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: () => {
      setErrorMessage("无法提交实绩审核");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/v1/lab-bookings/${id}/reject-usage`, { comment: "核验实绩不符，驳回" });
    },
    onSuccess: () => {
      setSuccessMessage("实绩驳回成功");
      queryClient.invalidateQueries({ queryKey: ["pending-usage-approvals"] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="使用记录审核" 
        subtitle="核验现场扫码签到、仪器耗材实际用量、以及实验参数并签字记档"
      />

      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[var(--radius-sm)] text-xs font-medium animate-scale-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">使用实绩日期</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">分室名称 / 对象</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">上报人</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">实际使用时段</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-44">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在汇总现场签到日志...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <HelpCircle className="w-10 h-10 mx-auto mb-2 text-[var(--ink-muted)] opacity-50" />
                    暂无任何需要审核的现场使用实绩记录
                  </td>
                </tr>
              ) : (
                data.items.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                    <td className="px-6 py-3.5 status-rail status-rail--pending font-mono text-[var(--ink-secondary)] text-xs">
                      {new Date(record.start_time).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-[var(--ink-primary)]">
                      {record.item_name || "实验室空间预约"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-medium">
                      {record.applicant_name || "教工"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)] font-mono">
                      {new Date(record.start_time).toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})} - {new Date(record.end_time).toLocaleTimeString("zh-CN", {hour:"2-digit", minute:"2-digit"})}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(record.id)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer bg-transparent border-none p-0"
                      >
                        审核通过
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(record.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
                      >
                        驳回
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default UsageApprovalPage;
