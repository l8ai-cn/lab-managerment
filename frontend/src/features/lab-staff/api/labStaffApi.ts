import { api } from "@/shared/api/client";

export interface LabStaff {
  id: string;
  employee_no: string;
  name: string;
  phone?: string;
  office_location?: string;
  user_id?: string;
  labs: Array<{ id: string; code: string; name: string }>;
  created_at: string;
  updated_at: string;
}

export interface LabStaffListResponse {
  items: LabStaff[];
  total: number;
  page: number;
  page_size: number;
}

export const labStaffApi = {
  list: (params: { page?: number; keyword?: string; lab_id?: string } = {}) =>
    api.get<LabStaffListResponse>("/lab-staff", { params }).then((r) => r.data),

  get: (id: string) => api.get<LabStaff>(`/lab-staff/${id}`).then((r) => r.data),

  create: (data: {
    employee_no: string;
    name: string;
    phone?: string;
    office_location?: string;
    lab_ids?: string[];
  }) => api.post<LabStaff>("/lab-staff", data).then((r) => r.data),

  update: (id: string, data: Partial<{ name: string; phone: string; office_location: string; lab_ids: string[] }>) =>
    api.patch<LabStaff>(`/lab-staff/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/lab-staff/${id}`),
};
