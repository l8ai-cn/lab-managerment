import { api } from "@/shared/api/client";

export type ReportSubmissionStatus = "draft" | "submitted" | "approved";

export const SUBMISSION_STATUS_LABELS: Record<ReportSubmissionStatus, string> = {
  draft: "草稿",
  submitted: "已提交",
  approved: "已审核",
};

export const SUBMISSION_STATUS_COLORS: Record<ReportSubmissionStatus, string> = {
  draft: "default",
  submitted: "processing",
  approved: "success",
};

export interface ReportTemplate {
  id: string;
  code: string;
  name: string;
  schema: Record<string, unknown>;
  description?: string;
  created_at: string;
}

export interface ReportTemplateListResponse {
  items: ReportTemplate[];
  total: number;
  page: number;
  page_size: number;
}

export interface ReportSubmission {
  id: string;
  template_id: string;
  template_name?: string;
  unit_name: string;
  period: string;
  data: Record<string, unknown>;
  status: ReportSubmissionStatus;
  created_at: string;
}

export interface ReportSubmissionListResponse {
  items: ReportSubmission[];
  total: number;
  page: number;
  page_size: number;
}

export interface TemplateCreate {
  code: string;
  name: string;
  schema?: Record<string, unknown>;
  description?: string;
}

export interface SubmissionCreate {
  template_id: string;
  unit_name: string;
  period: string;
  data?: Record<string, unknown>;
}

export interface SubmissionUpdate {
  unit_name?: string;
  period?: string;
  data?: Record<string, unknown>;
}

export interface AggregateStats {
  total_submissions: number;
  by_status: Record<string, number>;
  by_period: Record<string, number>;
  by_template: Record<string, number>;
}

export interface TemplateUpdate {
  code?: string;
  name?: string;
  schema?: Record<string, unknown>;
  description?: string;
}

export const dataReportingApi = {
  listTemplates: (params: { page?: number; page_size?: number; keyword?: string } = {}) =>
    api
      .get<ReportTemplateListResponse>("/data-reporting/templates", { params })
      .then((r) => r.data),

  getTemplate: (id: string) =>
    api.get<ReportTemplate>(`/data-reporting/templates/${id}`).then((r) => r.data),

  createTemplate: (data: TemplateCreate) =>
    api.post<ReportTemplate>("/data-reporting/templates", data).then((r) => r.data),

  updateTemplate: (id: string, data: TemplateUpdate) =>
    api.patch<ReportTemplate>(`/data-reporting/templates/${id}`, data).then((r) => r.data),

  deleteTemplate: (id: string) => api.delete(`/data-reporting/templates/${id}`),

  listSubmissions: (params: {
    page?: number;
    page_size?: number;
    template_id?: string;
    status?: ReportSubmissionStatus;
    period?: string;
  } = {}) =>
    api
      .get<ReportSubmissionListResponse>("/data-reporting/submissions", { params })
      .then((r) => r.data),

  getSubmission: (id: string) =>
    api.get<ReportSubmission>(`/data-reporting/submissions/${id}`).then((r) => r.data),

  updateSubmission: (id: string, data: SubmissionUpdate) =>
    api.patch<ReportSubmission>(`/data-reporting/submissions/${id}`, data).then((r) => r.data),

  submissionStats: () =>
    api.get<AggregateStats>("/data-reporting/submissions/stats").then((r) => r.data),

  createSubmission: (data: SubmissionCreate) =>
    api.post<ReportSubmission>("/data-reporting/submissions", data).then((r) => r.data),

  submit: (id: string) =>
    api.post<ReportSubmission>(`/data-reporting/submissions/${id}/submit`).then((r) => r.data),

  approve: (id: string) =>
    api.post<ReportSubmission>(`/data-reporting/submissions/${id}/approve`).then((r) => r.data),

  exportSubmissions: (templateId?: string) =>
    api
      .get("/data-reporting/submissions/export", {
        params: templateId ? { template_id: templateId } : undefined,
        responseType: "blob",
      })
      .then((r) => r.data as Blob),

  importSubmissions: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<{ imported: number }>("/data-reporting/submissions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
