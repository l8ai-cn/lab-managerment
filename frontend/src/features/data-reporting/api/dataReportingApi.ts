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

export interface SubmissionCreate {
  template_id: string;
  unit_name: string;
  period: string;
  data?: Record<string, unknown>;
}

export const dataReportingApi = {
  listTemplates: (params: { page?: number; page_size?: number; keyword?: string } = {}) =>
    api
      .get<ReportTemplateListResponse>("/data-reporting/templates", { params })
      .then((r) => r.data),

  getTemplate: (id: string) =>
    api.get<ReportTemplate>(`/data-reporting/templates/${id}`).then((r) => r.data),

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

  createSubmission: (data: SubmissionCreate) =>
    api.post<ReportSubmission>("/data-reporting/submissions", data).then((r) => r.data),

  submit: (id: string) =>
    api.post<ReportSubmission>(`/data-reporting/submissions/${id}/submit`).then((r) => r.data),

  approve: (id: string) =>
    api.post<ReportSubmission>(`/data-reporting/submissions/${id}/approve`).then((r) => r.data),
};
