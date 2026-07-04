import { api } from "@/shared/api/client";

export type ProjectType = "verification" | "comprehensive" | "design" | "innovation";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  verification: "验证性",
  comprehensive: "综合性",
  design: "设计性",
  innovation: "创新性",
};

export interface Course {
  id: string;
  code: string;
  name: string;
  department?: string;
  major?: string;
}

export interface CourseCreate {
  code: string;
  name: string;
  department?: string;
  major?: string;
}

export interface CourseListResponse {
  items: Course[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExperimentProject {
  id: string;
  course_id: string;
  course_name?: string;
  course_code?: string;
  name: string;
  type: ProjectType;
  hours?: number;
  semester?: string;
  created_at: string;
}

export interface ExperimentProjectCreate {
  course_id: string;
  name: string;
  type: ProjectType;
  hours?: number;
  semester?: string;
}

export interface ExperimentProjectListResponse {
  items: ExperimentProject[];
  total: number;
  page: number;
  page_size: number;
}

export interface BatchCopyRequest {
  source_course_id: string;
  target_course_id: string;
  project_ids?: string[];
}

export interface ProjectListParams {
  page?: number;
  page_size?: number;
  course_id?: string;
  project_type?: ProjectType;
  semester?: string;
  keyword?: string;
}

export const coursesApi = {
  list: (params: { page?: number; page_size?: number; keyword?: string; department?: string } = {}) =>
    api.get<CourseListResponse>("/courses", { params }).then((r) => r.data),

  get: (id: string) => api.get<Course>(`/courses/${id}`).then((r) => r.data),

  create: (data: CourseCreate) => api.post<Course>("/courses", data).then((r) => r.data),

  update: (id: string, data: Partial<CourseCreate>) =>
    api.patch<Course>(`/courses/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/courses/${id}`),
};

export const experimentProjectsApi = {
  list: (params: ProjectListParams = {}) =>
    api.get<ExperimentProjectListResponse>("/experiment-projects", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<ExperimentProject>(`/experiment-projects/${id}`).then((r) => r.data),

  create: (data: ExperimentProjectCreate) =>
    api.post<ExperimentProject>("/experiment-projects", data).then((r) => r.data),

  update: (id: string, data: Partial<ExperimentProjectCreate>) =>
    api.patch<ExperimentProject>(`/experiment-projects/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/experiment-projects/${id}`),

  batchCopy: (data: BatchCopyRequest) =>
    api.post<{ copied_count: number }>("/experiment-projects/batch-copy", data).then((r) => r.data),

  export: (params: { course_id?: string; semester?: string } = {}) =>
    api
      .get("/experiment-projects/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  import: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ success_count: number; error_count: number; errors: string[] }>(
        "/experiment-projects/import",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },
};
