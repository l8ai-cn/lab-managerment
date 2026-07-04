import { useMutation } from "@tanstack/react-query";
import { Button, Card, DatePicker, Form, Input, message } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { experimentsApi } from "../api/experimentsApi";

export function ExperimentForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const createMutation = useMutation({
    mutationFn: experimentsApi.create,
    onSuccess: (data) => {
      message.success("实验创建成功");
      navigate(`/experiments/${data.id}`);
    },
    onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
      message.error(err.response?.data?.detail ?? "创建失败");
    },
  });

  const onFinish = (values: {
    title: string;
    description?: string;
    hypothesis?: string;
    planned_start?: dayjs.Dayjs;
    planned_end?: dayjs.Dayjs;
  }) => {
    createMutation.mutate({
      title: values.title,
      description: values.description,
      hypothesis: values.hypothesis,
      planned_start: values.planned_start?.toISOString(),
      planned_end: values.planned_end?.toISOString(),
    });
  };

  return (
    <Card title="新建实验">
      <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 640 }}>
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: "请输入实验标题" }]}
        >
          <Input placeholder="实验标题" maxLength={200} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={4} placeholder="实验描述" maxLength={5000} />
        </Form.Item>
        <Form.Item name="hypothesis" label="假设">
          <Input.TextArea rows={3} placeholder="实验假设" maxLength={2000} />
        </Form.Item>
        <Form.Item name="planned_start" label="计划开始时间">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="planned_end" label="计划结束时间">
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            创建
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate("/experiments")}>
            取消
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
