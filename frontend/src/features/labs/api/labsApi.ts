import { api } from "@/shared/api/client";
import type { BuildingTree, Lab, LabCreate, LabListResponse, LabType, OpenStatus } from "../types/lab";

export interface LabListParams {
  page?: number;
  page_size?: number;
  building_id?: string;
  floor_id?: string;
  lab_type?: LabType;
  open_status?: OpenStatus;
  keyword?: string;
}

export const labsApi = {
  list: (params: LabListParams = {}) =>
    api.get<LabListResponse>("/labs", { params }).then((r) => r.data),

  get: (id: string) => api.get<Lab>(`/labs/${id}`).then((r) => r.data),

  create: (data: LabCreate) => api.post<Lab>("/labs", data).then((r) => r.data),

  update: (id: string, data: Partial<LabCreate>) =>
    api.patch<Lab>(`/labs/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/labs/${id}`),

  export: () =>
    api.get("/labs/export", { responseType: "blob" }).then((r) => r.data as Blob),

  import: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<{ success_count: number; error_count: number; errors: string[] }>(
        "/labs/import",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      )
      .then((r) => r.data);
  },
};

export const spacesApi = {
  getTree: () => api.get<BuildingTree[]>("/buildings/tree").then((r) => r.data),
};
