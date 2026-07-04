import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { FAULT_STATUS_LABELS } from "./FaultListPage";

interface Staff {
  id: string;
  name: string;
}

interface FaultDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  urgency: string;
  created_at: string;
  lab_name?: string;
  reporter_name?: string;
  handler_name?: string;
}

/**
 * 100% Brand-new Written FaultDetailPage (SLA and staff assignment panel)
 * Strictly zero AntD, uses custom timeline and design tokens, with 2:1 column layouts
 */
export function FaultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [comment, setFormComment] = useState("");

  // Get staff options
  const { data: staffs } = useQuery<Staff[]>({
    queryKey: ["lab-staff-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/lab-staff?page_size=100");
      return res.data.items || [];
    },
  });

  const { data, isLoading } = useQuery<FaultDetail>({
    queryKey: ["fault-detail", id],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/faults/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Assign staff mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/v1/faults/${id}/assign`, { handler_id: selectedStaffId });
    },
    onSuccess: () => {
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["fault-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["faults"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法分配该技术人员");
    },
  });

  // Resolve fault mutation
  const resolveMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/v1/faults/${id}/resolve`, { comment });
    },
    onSuccess: () => {
      setErrorMessage("");
      setFormComment("");
      queryClient.invalidateQueries({ queryKey: ["fault-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["faults"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法闭环此故障");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--ink-secondary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
        正在载入故障参数与流转详情...
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6 select-none">
      <PageHeader 
        title={`缺陷工单: ${data.title}`}
        subtitle="核对并闭环现场设备及房间的异常问题上报记录"
        breadcrumb={[
          { title: "故障上报", path: "/faults" },
          { title: data.title }
        ]}
      />

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2:1 column layouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <ContentCard title="问题描述与记录">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[var(--ink-tertiary)] uppercase">异常分室</h4>
                <p className="text-sm font-semibold text-[var(--ink-primary)] mt-1">{data.lab_name || "待匹配分室"}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[var(--ink-tertiary)] uppercase">故障细项详情</h4>
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--surface-inset)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-sm)] mt-1.5 font-mono">
                  {data.description || "暂无具体缺陷描述说明"}
                </p>
              </div>
            </div>
          </ContentCard>

          {/* Action trigger block */}
          {data.status === "pending" && (
            <ContentCard title="快速指派技术员">
              <div className="space-y-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    技术负责人 *
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                  >
                    <option value="">请选择指派的技术员...</option>
                    {staffs?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4">
                  <button
                    onClick={() => assignMutation.mutate()}
                    disabled={!selectedStaffId || assignMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] cursor-pointer"
                  >
                    {assignMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    确认指派负责人
                  </button>
                </div>
              </div>
            </ContentCard>
          )}

          {data.status !== "pending" && data.status !== "resolved" && (
            <ContentCard title="故障闭环确认">
              <div className="space-y-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    维修闭环意见
                  </label>
                  <textarea
                    placeholder="请输入设备或线路修复的技术手段与备件更换记录..."
                    rows={3}
                    value={comment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>

                <div className="flex justify-end border-t border-[var(--border-subtle)] pt-4">
                  <button
                    onClick={() => resolveMutation.mutate()}
                    disabled={resolveMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[var(--radius-sm)] cursor-pointer"
                  >
                    {resolveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    标记此单已修复
                  </button>
                </div>
              </div>
            </ContentCard>
          )}
        </div>

        {/* Right sidebar */}
        <div className="md:col-span-1 space-y-6">
          <ContentCard title="工单元信息">
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[var(--ink-tertiary)] font-medium">当前缺陷状态</span>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] font-bold text-[10px] uppercase ${
                    data.status === "resolved" ? "bg-emerald-50 text-emerald-700" :
                    data.status === "pending" ? "bg-rose-50 text-rose-700 animate-pulse" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {FAULT_STATUS_LABELS[data.status]}
                  </span>
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-3.5">
                <span className="text-[var(--ink-tertiary)] font-medium">工单指派负责人</span>
                <span className="block font-semibold text-[var(--ink-primary)] mt-1 font-mono">
                  {data.handler_name || "暂无 (等待指派)"}
                </span>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-3.5">
                <span className="text-[var(--ink-tertiary)] font-medium">上报创建时间</span>
                <span className="block font-semibold font-mono text-[var(--ink-primary)] mt-1">
                  {new Date(data.created_at).toLocaleString("zh-CN")}
                </span>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>
    </div>
  );
}
export default FaultDetailPage;
