import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, ShieldAlert, Check, HelpCircle } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface LabOption {
  id: string;
  name: string;
}

interface LabBookingRule {
  id: string;
  lab_id: string;
  max_duration_hours: number;
  min_duration_hours: number;
  max_bookings_per_user_weekly: number;
  require_approval: boolean;
}

/**
 * 100% Brand-new Written LabBookingRulesPage (Batch 3 Core Config)
 * Strictly zero AntD, uses custom numeric layout systems
 */
export function LabBookingRulesPage() {
  const queryClient = useQueryClient();
  const [selectedLabId, setSelectedLabId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formValues, setFormValues] = useState<Omit<LabBookingRule, "id">>({
    lab_id: "",
    max_duration_hours: 8,
    min_duration_hours: 2,
    max_bookings_per_user_weekly: 2,
    require_approval: true,
  });

  // Query labs options for select dropdown
  const { data: labs } = useQuery<LabOption[]>({
    queryKey: ["lab-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/labs?page_size=100");
      return res.data.items || [];
    },
  });

  // Query existing rule for selected lab
  const { isLoading: isRuleLoading } = useQuery<LabBookingRule>({
    queryKey: ["lab-booking-rule", selectedLabId],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/lab-bookings/rules/${selectedLabId}`);
      const rule = res.data;
      if (rule) {
        setFormValues({
          lab_id: selectedLabId,
          max_duration_hours: rule.max_duration_hours ?? 8,
          min_duration_hours: rule.min_duration_hours ?? 2,
          max_bookings_per_user_weekly: rule.max_bookings_per_user_weekly ?? 2,
          require_approval: rule.require_approval ?? true,
        });
      }
      return rule;
    },
    enabled: !!selectedLabId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      await axios.post("/api/v1/lab-bookings/rules", payload);
    },
    onSuccess: () => {
      setSuccessMessage("实验室预定限制与大纲核算规则已成功下发生效！");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["lab-booking-rule", selectedLabId] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存准入大纲规则");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId) {
      setErrorMessage("请先选择关联的分室实验室");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    saveMutation.mutate({
      ...formValues,
      lab_id: selectedLabId,
    });
  };

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6 select-none">
      <PageHeader 
        title="实验室规则" 
        subtitle="核定分室每日最大开放课时、单次课表上限及排课审批流"
      />

      <ContentCard className="bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3">
        <label className="text-[var(--text-label)] font-semibold text-[var(--ink-secondary)]">
          选择分室实验室：
        </label>
        <select
          value={selectedLabId}
          onChange={(e) => { setSelectedLabId(e.target.value); setErrorMessage(""); setSuccessMessage(""); }}
          className="px-3.5 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer focus:border-[var(--brand)]"
        >
          <option value="">请选择分室...</option>
          {labs?.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </ContentCard>

      {!selectedLabId ? (
        <ContentCard className="flex flex-col items-center justify-center py-20 text-[var(--ink-muted)]">
          <HelpCircle className="w-10 h-10 mb-2 opacity-50" />
          <span>请在上方先选择目标实验室，以调阅并精细下发其时间划归与审批前置参数。</span>
        </ContentCard>
      ) : isRuleLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--ink-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
          正在载入分室规则...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 animate-scale-in">
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[var(--radius-sm)] text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <ContentCard title="排课排考规则控制面板" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[var(--text-label)] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  单次排课上限时长 (小时)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={formValues.max_duration_hours}
                  onChange={(e) => setFormValues({ ...formValues, max_duration_hours: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  单次排课起步时段 (小时)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={formValues.min_duration_hours}
                  onChange={(e) => setFormValues({ ...formValues, min_duration_hours: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-[var(--border-subtle)] pt-5">
              <div>
                <label className="block text-[var(--text-label)] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  每周单班排课上限
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formValues.max_bookings_per_user_weekly}
                  onChange={(e) => setFormValues({ ...formValues, max_bookings_per_user_weekly: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div>
                <label className="block text-[var(--text-label)] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  教学排课是否经过院系审核
                </label>
                <select
                  value={formValues.require_approval ? "true" : "false"}
                  onChange={(e) => setFormValues({ ...formValues, require_approval: e.target.value === "true" })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                >
                  <option value="true">需要人工两级审批</option>
                  <option value="false">免除审批自动排课</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-5">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] disabled:opacity-50 cursor-pointer transition-colors"
              >
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                保存并下发生效
              </button>
            </div>
          </ContentCard>
        </form>
      )}
    </div>
  );
}
export default LabBookingRulesPage;
