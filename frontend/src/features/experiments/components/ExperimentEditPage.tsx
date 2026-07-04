import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DatePicker, Form, Input, Popconfirm, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { experimentsApi } from "../api/experimentsApi";

export function ExperimentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["experiment", id],
    queryFn: () => experimentsApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        hypothesis: data.hypothesis,
        planned_start: data.planned_start ? dayjs(data.planned_start) : undefined,
        planned_end: data.planned_end ? dayjs(data.planned_end) : undefined,
      });
    }
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: {
      title: string;
      description?: string;
      hypothesis?: string;
      planned_start?: string;
      planned_end?: string;
    }) => experimentsApi.update(id!, values),
    onSuccess: () => {
      message.success("实验已更新");
      queryClient.invalidateQueries({ queryKey: ["experiment", id] });
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
      navigate(`/experiments/${id}`);
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      message.error(err.response?.data?.detail ?? "更新失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => experimentsApi.delete(id!),
    onSuccess: () => {
      message.success("实验已删除");
      navigate("/experiments");
    },
  });

  if (isLoading || !data) return null;

  return (
    <Card
      title="编辑实验"
      extra={
        data.status === "draft" ? (
          <Popconfirm title="确认删除该实验？" onConfirm={() => deleteMutation.mutate()}>
            <Button danger loading={deleteMutation.isPending}>
              删除
            </Button>
          </Popconfirm>
        ) : null
      }
    >
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 640 }}
        onFinish={(values) =>
          updateMutation.mutate({
            title: values.title,
            description: values.description,
            hypothesis: values.hypothesis,
            planned_start: values.planned_start?.toISOString(),
            planned_end: values.planned_end?.toISOString(),
          })
        }
      >
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={4} maxLength={5000} />
        </Form.Item>
        <Form.Item name="hypothesis" label="假设">
          <Input.TextArea rows={3} maxLength={2000} />
        </Form.Item>
        <Form.Item name="planned_start" label="计划开始时间">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="planned_end" label="计划结束时间">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            保存
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate(`/experiments/${id}`)}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
