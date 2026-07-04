import { api } from "@/shared/api/client";

export type UserRole =
  | "system_admin"
  | "dept_admin"
  | "lab_admin"
  | "teacher"
  | "student"
  | "guest";

export interface User {
  id: string;
  username: string;
  name: string;
  employee_no?: string;
  phone?: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserCreate {
  username: string;
  password: string;
  name: string;
  employee_no?: string;
  phone?: string;
  role: UserRole;
  department?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  system_admin: "系统管理员",
  dept_admin: "院系管理员",
  lab_admin: "实验室管理员",
  teacher: "教师",
  student: "学生",
  guest: "临时人员",
};

export const usersApi = {
  list: (params: { page?: number; page_size?: number; role?: UserRole; keyword?: string } = {}) =>
    api.get<UserListResponse>("/users", { params }).then((r) => r.data),

  get: (id: string) => api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) => api.post<User>("/users", data).then((r) => r.data),

  update: (id: string, data: Partial<UserCreate & { is_active: boolean }>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
};
