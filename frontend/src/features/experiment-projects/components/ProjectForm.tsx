import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { PROJECT_TYPE_LABELS } from "./ProjectList";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface ProjectFormValues {
  course_id: string;
  name: string;
  type: string;
  hours: number;
  semester: string;
}

interface ProjectFormProps {
  editingId?: string;
}

export function ProjectForm({ editingId }: ProjectFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const [values, setValues] = useState<ProjectFormValues>({
    course_id: "",
    name: "",
    type: "verification",
    hours: 2,
    semester: "",
  });

  // Get courses options
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["courses-options"],
    queryFn: async () => {
      const res = await axios.get("/api/v1/courses?page_size=100");
      return res.data.items || [];
    },
  });

  // Load editing project data
  const { isLoading: isProjectLoading } = useQuery({
    queryKey: ["experiment-project", editingId],
    queryFn: async () => {
      const res = await axios.get(`/api/v1/experiment-projects/${editingId}`);
      const project = res.data;
      setValues({
        course_id: project.course_id || "",
        name: project.name || "",
        type: project.type || "verification",
        hours: project.hours ?? 2,
        semester: project.semester || "",
      });
      return project;
    },
    enabled: !!editingId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectFormValues) => {
      if (editingId) {
        await axios.patch(`/api/v1/experiment-projects/${editingId}`, payload);
      } else {
        await axios.post("/api/v1/experiment-projects", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
      navigate("/experiment-projects");
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存大纲指标");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.course_id || !values.name || !values.type) {
      setErrorMessage("请填写所有的必填项 (*)");
      return;
    }
    setErrorMessage("");
    saveMutation.mutate(values);
  };

  if (editingId && isProjectLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--ink-secondary)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand)] mb-3" />
        正在载入大纲参数...
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full animate-fade-in flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 pb-5 border-b border-[var(--border-default)]">
        <button
          onClick={() => navigate("/experiment-projects")}
          className="inline-flex items-center justify-center p-2 rounded-[var(--radius-sm)] text-[var(--ink-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold tracking-tight">
            {editingId ? "编辑大纲指标" : "新建大纲指标"}
          </h1>
          <p className="text-xs text-[var(--ink-secondary)] mt-1">配置本项实验项目的计划学时、归属课程与业务类型</p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/20 rounded-[var(--radius-sm)] text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form Card (max-w-3xl left aligned per design.md template C) */}
      <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-6 shadow-[var(--shadow-sm)] space-y-6">
        <div className="space-y-4">
          <h3 className="text-[var(--text-h3)] font-semibold text-[var(--ink-primary)]">基本配置</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                所属课程 *
              </label>
              <select
                disabled={!!editingId}
                value={values.course_id}
                onChange={(e) => setValues({ ...values, course_id: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">请选择关联课程...</option>
                {courses?.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                项目类型 *
              </label>
              <select
                value={values.type}
                onChange={(e) => setValues({ ...values, type: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              >
                {Object.entries(PROJECT_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
              项目名称 *
            </label>
            <input
              type="text"
              placeholder="如：半导体PN结物理特性研究"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
            />
          </div>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-6 space-y-4">
          <h3 className="text-[var(--text-h3)] font-semibold text-[var(--ink-primary)]">计划与学期</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                计划学时 (hours)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={values.hours}
                onChange={(e) => setValues({ ...values, hours: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                推荐学期
              </label>
              <input
                type="text"
                placeholder="如：2025-2026-1"
                value={values.semester}
                onChange={(e) => setValues({ ...values, semester: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none transition-all focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[var(--focus-ring)]"
              />
            </div>
          </div>
        </div>

        {/* Form Action Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/experiment-projects")}
            className="px-4 py-2 text-xs font-medium text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] disabled:opacity-50 cursor-pointer transition-colors"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            保存大纲
          </button>
        </div>
      </form>
    </div>
  );
}

export function ProjectFormPage() {
  return <ProjectForm />;
}

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  return <ProjectForm editingId={id} />;
}
