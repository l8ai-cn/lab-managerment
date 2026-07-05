import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";

interface Lab {
  id: string;
  name: string;
}

export function MobileFaultReport() {
  const [labId, setLabId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Query labs option for selector
  const { data: labs, isLoading } = useQuery<{ items: Lab[] }>({
    queryKey: ["mobile-lab-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/labs?page_size=100");
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { lab_id: string; title: string; description: string; urgency: string }) => {
      await axios.post("/api/v1/faults", payload);
    },
    onSuccess: () => {
      setSuccessMessage("故障上报成功！实验中心技术负责人将快速响应！");
      setTitle("");
      setDescription("");
      setLabId("");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法提报故障");
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labId || !title) {
      setErrorMessage("请填写必填项 (*)");
      return;
    }
    setErrorMessage("");
    saveMutation.mutate({
      lab_id: labId,
      title: title.trim(),
      description: description.trim(),
      urgency: "medium",
    });
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-[var(--ink-primary)]">故障上报</h2>
        <p className="text-[10px] text-[var(--ink-tertiary)]">扫码或手动登记分室设备/线路/安全故障异常</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[var(--radius-sm)] text-xs font-medium">
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

      <form onSubmit={handleFormSubmit} className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-4 shadow-[var(--shadow-sm)] space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-[var(--ink-secondary)] mb-1.5">
            关联分室实验室 *
          </label>
          {isLoading ? (
            <div className="py-2 text-[var(--ink-muted)] flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />正在同步分室节点...
            </div>
          ) : (
            <select
              value={labId}
              onChange={(e) => setLabId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
            >
              <option value="">请选择发生故障的实验室...</option>
              {labs?.items.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--ink-secondary)] mb-1.5">
            故障异常标题 *
          </label>
          <input
            type="text"
            placeholder="如：物理化学分室2号台不锈钢接线板短路断电"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--ink-secondary)] mb-1.5">
            详细故障异常描述说明
          </label>
          <textarea
            placeholder="请输入发生的细节，包括仪器SN号、故障征兆，以便维修员携带对应耗材..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            起草提报工单 (Submit)
          </button>
        </div>
      </form>
    </div>
  );
}
export default MobileFaultReport;
