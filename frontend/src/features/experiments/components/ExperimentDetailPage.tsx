import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Play, Pause, Square, Archive, Ban, RefreshCw, AlertCircle, Check } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { EXPERIMENT_STATUS_LABELS } from "./ExperimentListPage";

interface ExperimentDetail {
  id: string;
  code: string;
  title: string;
  description: string | null;
  hypothesis: string | null;
  status: string;
  created_at: string;
}

/**
 * 100% Brand-new Written ExperimentDetailPage (8-state state machine fluid transition panel)
 * Strictly zero AntD, uses custom timeline and design tokens, with double-column layout
 */
export function ExperimentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const { data, isLoading } = useQuery<ExperimentDetail>({
    queryKey: ["experiment-detail", id],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/experiments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // State transitions mutation
  const transitionMutation = useMutation({
    mutationFn: async (action: string) => {
      await axios.post(`/api/v1/experiments/${id}/${action}`);
    },
    onSuccess: () => {
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["experiment-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法执行此状态流转");
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--ink-secondary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
        正在载入大纲参数与八态流转配置...
      </div>
    );
  }

  // Determine allowed transitions based on active backend schema
  const status = data.status;

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6 select-none">
      <PageHeader 
        title={`实验大纲详情: ${data.code}`}
        subtitle="科研实验计划、实验假说设定及8态业务流转审批"
        breadcrumb={[
          { title: "科研实验", path: "/experiments" },
          { title: data.code }
        ]}
      />

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main double column or single compact card per Template B specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Core parameters card */}
        <div className="md:col-span-2 space-y-6">
          <ContentCard title="课题内容设计">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-[var(--ink-tertiary)] uppercase">实验主题</h4>
                <p className="text-sm font-semibold text-[var(--ink-primary)] mt-1">{data.title}</p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[var(--ink-tertiary)] uppercase">实验假说/预期目的</h4>
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed bg-[var(--surface-inset)] border border-[var(--border-subtle)] p-3 rounded-[var(--radius-sm)] mt-1.5 font-mono">
                  {data.hypothesis || "暂无录入实验前假说说明"}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[var(--ink-tertiary)] uppercase">具体大纲说明</h4>
                <p className="text-xs text-[var(--ink-secondary)] leading-relaxed mt-1.5">
                  {data.description || "暂无具体大纲描述"}
                </p>
              </div>
            </div>
          </ContentCard>

          {/* State Transition Controllers */}
          <ContentCard title="精密 8 态状态机生命周期控制">
            <p className="text-[11px] text-[var(--ink-secondary)] mb-4 leading-normal">
              实验流转符合学术严谨规范，状态机流转控制如下（当前状态：<span className="font-bold text-[var(--brand)]">{EXPERIMENT_STATUS_LABELS[status]}</span>）：
            </p>

            <div className="flex flex-wrap gap-2.5">
              {status === "draft" && (
                <>
                  <button
                    onClick={() => transitionMutation.mutate("submit")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    提交计划 (Submit)
                  </button>
                  <button
                    onClick={() => transitionMutation.mutate("cancel")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    取消计划 (Cancel)
                  </button>
                </>
              )}

              {status === "planned" && (
                <>
                  <button
                    onClick={() => transitionMutation.mutate("start")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    启动实验 (Start)
                  </button>
                  <button
                    onClick={() => transitionMutation.mutate("cancel")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    取消计划 (Cancel)
                  </button>
                </>
              )}

              {status === "in_progress" && (
                <>
                  <button
                    onClick={() => transitionMutation.mutate("pause")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    暂停实验 (Pause)
                  </button>
                  <button
                    onClick={() => transitionMutation.mutate("complete")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    标记完成 (Complete)
                  </button>
                  <button
                    onClick={() => transitionMutation.mutate("fail")}
                    disabled={transitionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    标记失败 (Fail)
                  </button>
                </>
              )}

              {status === "paused" && (
                <button
                  onClick={() => transitionMutation.mutate("resume")}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  恢复运行 (Resume)
                </button>
              )}

              {(status === "completed" || status === "failed") && (
                <button
                  onClick={() => transitionMutation.mutate("archive")}
                  disabled={transitionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  归档封卷 (Archive)
                </button>
              )}

              {(status === "archived" || status === "cancelled") && (
                <span className="text-xs text-[var(--ink-muted)] italic font-medium">本实验项目周期已完全终结，无法继续流转。</span>
              )}
            </div>
          </ContentCard>
        </div>

        {/* Right side Metadata column */}
        <div className="md:col-span-1 space-y-6">
          <ContentCard title="实验元数据">
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[var(--ink-tertiary)] font-medium">当前生命状态</span>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] font-bold text-[10px] uppercase ${
                    status === "completed" || status === "archived" ? "bg-emerald-50 text-emerald-700" :
                    status === "in_progress" || status === "planned" ? "bg-blue-50 text-blue-700" :
                    status === "failed" || status === "cancelled" ? "bg-rose-50 text-rose-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {EXPERIMENT_STATUS_LABELS[status]}
                  </span>
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-3.5">
                <span className="text-[var(--ink-tertiary)] font-medium">创建时间</span>
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
export default ExperimentDetailPage;
