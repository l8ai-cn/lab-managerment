import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, ShieldAlert, Check, HelpCircle } from "lucide-react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";

interface InstrumentOption {
  id: string;
  name: string;
}

interface BookingRule {
  id: string;
  instrument_id: string;
  max_duration_hours: number;
  min_duration_hours: number;
  max_bookings_per_user_weekly: number;
  require_approval: boolean;
  external_rules: Record<string, any>;
}

/**
 * 100% Brand-new Written InstrumentBookingRulesPage (Batch 3 Core Config)
 * Strictly zero AntD Form or TimePicker, uses custom high-fidelity numeric inputs
 */
export function InstrumentBookingRulesPage() {
  const queryClient = useQueryClient();
  const [selectedInsId, setSelectedInsId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formValues, setFormValues] = useState<Omit<BookingRule, "id">>({
    instrument_id: "",
    max_duration_hours: 4,
    min_duration_hours: 1,
    max_bookings_per_user_weekly: 3,
    require_approval: true,
    external_rules: {},
  });

  // Query instruments for dropdown options
  const { data: instruments } = useQuery<InstrumentOption[]>({
    queryKey: ["instrument-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/instruments?page_size=100");
      return res.data.items || [];
    },
  });

  // Query existing rules for selected instrument
  const { isLoading: isRuleLoading } = useQuery<BookingRule>({
    queryKey: ["instrument-booking-rule", selectedInsId],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/instruments/${selectedInsId}/booking-rule`);
      const rule = res.data;
      if (rule) {
        setFormValues({
          instrument_id: selectedInsId,
          max_duration_hours: rule.max_duration_hours ?? 4,
          min_duration_hours: rule.min_duration_hours ?? 1,
          max_bookings_per_user_weekly: rule.max_bookings_per_user_weekly ?? 3,
          require_approval: rule.require_approval ?? true,
          external_rules: rule.external_rules || {},
        });
      }
      return rule;
    },
    enabled: !!selectedInsId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      await axios.post("/api/v1/instruments/booking-rules", payload);
    },
    onSuccess: () => {
      setSuccessMessage("预约规则保存并前置校验生效中！");
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["instrument-booking-rule", selectedInsId] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存准入规则");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsId) {
      setErrorMessage("请先选择目标精密设备");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    saveMutation.mutate({
      ...formValues,
      instrument_id: selectedInsId,
    });
  };

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6 select-none">
      <PageHeader 
        title="仪器规则" 
        subtitle="逐台配置设备开放时长限制、每周最高预约额度以及校外人员收费标准"
      />

      {/* Target selector card */}
      <ContentCard className="bg-[var(--surface)] p-4 flex flex-wrap items-center gap-3">
        <label className="text-[var(--text-label)] font-semibold text-[var(--ink-secondary)]">
          选择精密设备仪器：
        </label>
        <select
          value={selectedInsId}
          onChange={(e) => { setSelectedInsId(e.target.value); setErrorMessage(""); setSuccessMessage(""); }}
          className="px-3.5 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer focus:border-[var(--brand)]"
        >
          <option value="">请选择设备...</option>
          {instruments?.map((ins) => (
            <option key={ins.id} value={ins.id}>{ins.name}</option>
          ))}
        </select>
      </ContentCard>

      {!selectedInsId ? (
        <ContentCard className="flex flex-col items-center justify-center py-20 text-[var(--ink-muted)]">
          <HelpCircle className="w-10 h-10 mb-2 opacity-50" />
          <span>请在上方先选择目标精密仪器，以调阅和编辑其准入控制参数。</span>
        </ContentCard>
      ) : isRuleLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--ink-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
          正在调阅当前规则...
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

          {/* Controls settings */}
          <ContentCard title="准入规则配置 (Access Controls)" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[var(--text-label)] font-semibold text-[var(--ink-secondary)] mb-1.5">
                  单次预约上限时长 (小时)
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
                  单次预约下限时长 (小时)
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
                  每人每周最大预约次数 (Weekly Quota)
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
                  预约是否需要审批 (Manual Check)
                </label>
                <select
                  value={formValues.require_approval ? "true" : "false"}
                  onChange={(e) => setFormValues({ ...formValues, require_approval: e.target.value === "true" })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                >
                  <option value="true">需要人工审批 (Manual Approval)</option>
                  <option value="false">自动放行审批 (Auto-approve)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end border-t border-[var(--border-subtle)] pt-5">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] disabled:opacity-50 cursor-pointer transition-colors"
              >
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                保存规则配置
              </button>
            </div>
          </ContentCard>
        </form>
      )}
    </div>
  );
}
export default InstrumentBookingRulesPage;
