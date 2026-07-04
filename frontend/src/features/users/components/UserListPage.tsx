import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Select, Switch, Table, Tag, message } from "antd";
import { useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  ROLE_LABELS,
  usersApi,
  type User,
  type UserCreate,
  type UserRole,
} from "../api/usersApi";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export function UserListPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole>();
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<UserCreate>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, roleFilter, keyword],
    queryFn: () =>
      usersApi.list({ page, page_size: 20, role: roleFilter, keyword: keyword || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      message.success("用户已创建");
      setCreateOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error("创建失败，请检查用户名是否重复"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersApi.update(id, { is_active }),
    onSuccess: () => {
      message.success("状态已更新");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const columns = [
    { title: "用户名", dataIndex: "username", width: 120 },
    { title: "姓名", dataIndex: "name", width: 100 },
    { title: "工号", dataIndex: "employee_no", width: 110, render: (v: string) => v || "-" },
    {
      title: "角色",
      dataIndex: "role",
      width: 120,
      render: (r: UserRole) => <Tag>{ROLE_LABELS[r]}</Tag>,
    },
    { title: "院系", dataIndex: "department", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "状态",
      dataIndex: "is_active",
      width: 90,
      render: (active: boolean, record: User) => (
        <Switch
          checked={active}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => toggleMutation.mutate({ id: record.id, is_active: checked })}
        />
      ),
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN"),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新增用户
          </Button>
        }
      />

      <FilterBar>
        <Input.Search placeholder="搜索用户名或姓名" allowClear onSearch={setKeyword} style={{ width: 240 }} />
        <Select placeholder="角色筛选" allowClear options={ROLE_OPTIONS} style={{ width: 160 }} onChange={setRoleFilter} />
      </FilterBar>

      <ContentCard noPadding>
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.total,
            onChange: setPage,
            showTotal: (t) => `共 ${t} 条`,
            showSizeChanger: false,
          }}
        />
      </ContentCard>

      <Modal
        title="新增用户"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)} initialValues={{ role: "teacher" }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="employee_no" label="工号">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="院系/部门">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
