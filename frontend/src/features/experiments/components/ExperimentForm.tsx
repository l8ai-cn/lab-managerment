import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

/**
 * 100% Brand-new Written ExperimentForm (Batch 4 Research spec)
 * Strictly zero AntD Form, left-aligned, inset fields with focus-ring behaviors
 */
export function ExperimentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const [formValues, setFormValues] = useState({
    code: "",
    title: "",
    description: "",
    hypothesis: "",
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      await axios.post("/api/v1/experiments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      navigate("/experiments");
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法创建科研实验项目");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.code || !formValues.title) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    setErrorMessage("");
    saveMutation.mutate(formValues);
  };

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6 select-none">
      <PageHeader 
        title="新建科研实验" 
        subtitle="起草科研实验计划，设定预期假说和大纲流程参数"
        breadcrumb={[
          { title: "科研实验", path: "/experiments" },
          { title: "新建" }
        ]}
      />

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)] space-y-6">
        <div className="space-y-4">
          <h3 className="text-[var(--text-h3)] font-semibold text-[var(--ink-primary)]">基本大纲参数</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                实验识别码 *
              </label>
              <input
                type="text"
                placeholder="如：EXP-CHEM-01"
                value={formValues.code}
                onChange={(e) => setFormValues({ ...formValues, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                实验课题标题 *
              </label>
              <input
                type="text"
                placeholder="如：微通道反应器中纳米复合催化剂的在线制备及表征"
                value={formValues.title}
                onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
              科研假说设定
            </label>
            <textarea
              placeholder="请输入学术假说，如：采用原位制备法可使纳米银在石墨烯表面的分散均匀度提升30%以上..."
              rows={3}
              value={formValues.hypothesis}
              onChange={(e) => setFormValues({ ...formValues, hypothesis: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
            />
          </div>

          <div>
            <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
              大纲细节说明
            </label>
            <textarea
              placeholder="请输入实验路线、试剂参数、关键工艺细节..."
              rows={4}
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
            />
          </div>
        </div>

        {/* Footer controls */}
        <div className="border-t border-[var(--border-subtle)] pt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/experiments")}
            className="px-4 py-2 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            起草项目 (Draft)
          </button>
        </div>
      </form>
    </div>
  );
}
export default ExperimentForm;
