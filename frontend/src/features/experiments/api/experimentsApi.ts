import axios from "axios";
import type {
  Experiment,
  ExperimentCreate,
  ExperimentListResponse,
  ExperimentStatus,
} from "../types/experiment";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

export interface ExperimentListParams {
  page?: number;
  page_size?: number;
  status?: ExperimentStatus[];
  owner_id?: string;
  project_id?: string;
  keyword?: string;
}

export const experimentsApi = {
  list: (params: ExperimentListParams = {}) =>
    api.get<ExperimentListResponse>("/experiments", { params }).then((r) => r.data),

  get: (id: string) => api.get<Experiment>(`/experiments/${id}`).then((r) => r.data),

  create: (data: ExperimentCreate) =>
    api.post<Experiment>("/experiments", data).then((r) => r.data),

  update: (id: string, data: Partial<ExperimentCreate>) =>
    api.patch<Experiment>(`/experiments/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/experiments/${id}`),

  transition: (id: string, action: string, reason?: string) =>
    api
      .post<{ id: string; status: ExperimentStatus; message: string }>(
        `/experiments/${id}/${action}`,
        reason ? { reason } : undefined,
      )
      .then((r) => r.data),
};
