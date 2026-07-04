import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Modal, Select, message } from "antd";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PROJECT_TYPE_LABELS,
  coursesApi,
  experimentProjectsApi,
  type ExperimentProject,
  type ExperimentProjectCreate,
} from "../api/experimentProjectsApi";

const TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface ProjectFormProps {
  editing?: ExperimentProject | null;
}

export function ProjectForm({ editing }: ProjectFormProps) {
  const [form] = Form.useForm<ExperimentProjectCreate>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: coursesData } = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => coursesApi.list({ page_size: 100 }),
  });

  useEffect(() => {
    if (editing) {
      form.setFieldsValue({
        course_id: editing.course_id,
        name: editing.name,
        type: editing.type,
        hours: editing.hours,
        semester: editing.semester,
      });
    }
  }, [editing, form]);

  const saveMutation = useMutation({
    mutationFn: (values: ExperimentProjectCreate) =>
      editing
        ? experimentProjectsApi.update(editing.id, values)
        : experimentProjectsApi.create(values),
    onSuccess: () => {
      message.success(editing ? "更新成功" : "创建成功");
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
      navigate("/experiment-projects");
    },
    onError: () => message.error("保存失败"),
  });

  const courseOptions =
    coursesData?.items.map((c) => ({ value: c.id, label: `${c.code} ${c.name}` })) ?? [];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>{editing ? "编辑实验项目" : "新建实验项目"}</h2>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
        onFinish={(v) => saveMutation.mutate(v)}
      >
        <Form.Item name="course_id" label="所属课程" rules={[{ required: true }]}>
          <Select options={courseOptions} placeholder="选择课程" disabled={!!editing} />
        </Form.Item>
        <Form.Item name="name" label="项目名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="项目类型" rules={[{ required: true }]}>
          <Select options={TYPE_OPTIONS} placeholder="选择类型" />
        </Form.Item>
        <Form.Item name="hours" label="学时">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="semester" label="学期">
          <Input placeholder="如 2025-2026-1" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            保存
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate("/experiment-projects")}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export function ProjectFormPage() {
  return <ProjectForm />;
}

export function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["experiment-project", id],
    queryFn: () => experimentProjectsApi.get(id!),
    enabled: !!id,
  });
  if (isLoading || !data) return null;
  return <ProjectForm editing={data} />;
}

interface CopyModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  sourceCourseId?: string;
}

export function ProjectCopyModal({ open, onClose, selectedIds, sourceCourseId }: CopyModalProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: coursesData } = useQuery({
    queryKey: ["courses-options"],
    queryFn: () => coursesApi.list({ page_size: 100 }),
    enabled: open,
  });

  const copyMutation = useMutation({
    mutationFn: experimentProjectsApi.batchCopy,
    onSuccess: (result) => {
      message.success(`已复制 ${result.copied_count} 个项目`);
      queryClient.invalidateQueries({ queryKey: ["experiment-projects"] });
      onClose();
      form.resetFields();
    },
    onError: () => message.error("复制失败"),
  });

  const courseOptions =
    coursesData?.items
      .filter((c) => c.id !== sourceCourseId)
      .map((c) => ({ value: c.id, label: `${c.code} ${c.name}` })) ?? [];

  return (
    <Modal
      title="批量复制项目"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={copyMutation.isPending}
    >
      <p>将复制 {selectedIds.length || "全部"} 个项目到目标课程</p>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          if (!sourceCourseId) return;
          copyMutation.mutate({
            source_course_id: sourceCourseId,
            target_course_id: values.target_course_id,
            project_ids: selectedIds.length ? selectedIds : undefined,
          });
        }}
      >
        <Form.Item name="target_course_id" label="目标课程" rules={[{ required: true }]}>
          <Select options={courseOptions} placeholder="选择目标课程" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
