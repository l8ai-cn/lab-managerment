import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Plus, Search, Loader2, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

export const USER_ROLE_LABELS: Record<string, string> = {
  system_admin: "系统管理员",
  dept_admin: "院系管理员",
  lab_admin: "实验室管理员",
  teacher: "教师",
  student: "学生",
  guest: "临时人员",
};

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: string;
  department: string | null;
  employee_no: string | null;
  phone: string | null;
  is_active: boolean;
}

interface ListResponse {
  items: UserRecord[];
  total: number;
}

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editing, setEditing] = useState<UserRecord | null>(null);

  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
    name: "",
    role: "student",
    department: "",
    employee_no: "",
    phone: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["users", page, keyword, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("page_size", "10");
      if (keyword) params.append("keyword", keyword);
      if (roleFilter) params.append("role", roleFilter);

      const res = await axios.get(`/api/v1/users?${params.toString()}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formValues) => {
      if (editing) {
        await axios.patch(`/api/v1/users/${editing.id}`, payload);
      } else {
        await axios.post("/api/v1/users", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setErrorMessage("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.detail || "无法保存用户设置");
    },
  });

  const handleOpenNew = () => {
    setEditing(null);
    setFormValues({
      username: "",
      password: "",
      name: "",
      role: "student",
      department: "",
      employee_no: "",
      phone: "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleOpenEdit = (user: UserRecord) => {
    setEditing(user);
    setFormValues({
      username: user.username,
      password: "", // do not populate password for security
      name: user.name,
      role: user.role,
      department: user.department || "",
      employee_no: user.employee_no || "",
      phone: user.phone || "",
    });
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.username || !formValues.name) {
      setErrorMessage("请填写必填字段 (*)");
      return;
    }
    saveMutation.mutate(formValues);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in select-none">
      <PageHeader 
        title="用户管理" 
        subtitle="多角色统一身份认证及细粒度 RBAC 授权权限控制"
        extra={
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] shadow-[var(--shadow-sm)] cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新建用户
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--ink-muted)]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="搜索工号/学号、姓名、账号..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
              className="block w-64 pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] placeholder-[var(--ink-muted)] outline-none focus:border-[var(--brand)]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-secondary)] outline-none cursor-pointer focus:border-[var(--brand)]"
          >
            <option value="">所有系统角色</option>
            {Object.entries(USER_ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left">
            <thead className="bg-[var(--canvas)]">
              <tr>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider w-36">账号用户名</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">姓名 / 证件号</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">角色类型</th>
                <th scope="col" className="px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider">院系背景</th>
                <th scope="col" className="relative px-6 py-3 text-[11px] font-medium text-[var(--ink-tertiary)] uppercase tracking-wider text-right w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--brand)]" />
                    正在载入用户库...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-[var(--ink-muted)]">
                    未找到相关的系统账户
                  </td>
                </tr>
              ) : (
                data.items.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--surface-inset)] transition-colors">
                    <td className="px-6 py-3.5 status-rail status-rail--ready font-mono text-[var(--ink-primary)] text-xs font-semibold">
                      {record.username}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-[var(--ink-primary)] block">{record.name}</span>
                      {record.employee_no && (
                        <span className="text-[10px] text-[var(--ink-tertiary)] font-mono block mt-0.5">{record.employee_no}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-bold ${
                        record.role === "system_admin" ? "bg-indigo-50 text-indigo-700" :
                        record.role === "teacher" ? "bg-emerald-50 text-emerald-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {USER_ROLE_LABELS[record.role] || record.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-[var(--ink-secondary)]">
                      {record.department || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(record)}
                        className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] cursor-pointer bg-transparent border-none p-0"
                      >
                        授权编辑
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="bg-[var(--canvas)] border-t border-[var(--border-subtle)] px-6 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ink-secondary)]">
              共 <span className="font-semibold text-[var(--ink-primary)] font-mono">{data.total}</span> 个注册账户
            </span>
            <div className="inline-flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一页
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= data.total}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] disabled:opacity-40 cursor-pointer transition-colors"
              >
                下一页
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popover overlay modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-6 max-w-sm w-full shadow-[var(--shadow-md)] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-semibold text-[var(--ink-primary)]">
                {editing ? "编辑账户权限" : "创建全新账户"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 flex items-start gap-2 p-3.5 bg-[var(--status-fault-subtle)] text-[var(--status-fault)] border border-[var(--status-fault)]/10 rounded-[var(--radius-sm)] text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  登录账户名 *
                </label>
                <input
                  type="text"
                  placeholder="如：stu2025"
                  disabled={!!editing}
                  value={formValues.username}
                  onChange={(e) => setFormValues({ ...formValues, username: e.target.value.toLowerCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              {!editing && (
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    登录初始密码 *
                  </label>
                  <input
                    type="password"
                    placeholder="请输入初始密码..."
                    value={formValues.password}
                    onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                  姓名 *
                </label>
                <input
                  type="text"
                  placeholder="如：张老师"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    系统权限角色
                  </label>
                  <select
                    value={formValues.role}
                    onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none cursor-pointer"
                  >
                    {Object.entries(USER_ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-label)] font-medium text-[var(--ink-secondary)] mb-1.5">
                    归属部门/院系
                  </label>
                  <input
                    type="text"
                    placeholder="如：化学学院"
                    value={formValues.department}
                    onChange={(e) => setFormValues({ ...formValues, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-inset)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--ink-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-[var(--ink-secondary)] bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] hover:bg-[var(--surface-inset)] cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] rounded-[var(--radius-sm)] disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
                >
                  {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  保存授权
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserListPage;
