import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Select, message } from "antd";
import { useNavigate } from "react-router-dom";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { labsApi, spacesApi } from "../api/labsApi";
import { LAB_TYPE_LABELS, OPEN_STATUS_LABELS, type LabType, type OpenStatus } from "../types/lab";

const LAB_TYPE_OPTIONS = Object.entries(LAB_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const OPEN_STATUS_OPTIONS = Object.entries(OPEN_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function LabForm() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: tree } = useQuery({
    queryKey: ["building-tree"],
    queryFn: spacesApi.getTree,
  });

  const createMutation = useMutation({
    mutationFn: labsApi.create,
    onSuccess: (data) => {
      message.success("实验室创建成功");
      navigate(`/labs/${data.id}`);
    },
    onError: () => message.error("创建失败"),
  });

  const buildingId = Form.useWatch("building_id", form);
  const floorId = Form.useWatch("floor_id", form);

  const buildingOptions = tree?.map((b) => ({ value: b.id, label: b.name })) ?? [];
  const floorOptions =
    tree?.find((b) => b.id === buildingId)?.floors.map((f) => ({ value: f.id, label: f.name })) ?? [];
  const roomOptions =
    tree
      ?.find((b) => b.id === buildingId)
      ?.floors.find((f) => f.id === floorId)
      ?.rooms.map((r) => ({ value: r.id, label: r.code ? `${r.name}(${r.code})` : r.name })) ?? [];

  return (
    <>
      <PageHeader
        title="新建实验室"
        breadcrumb={[
          { title: "实验室管理" },
          { title: "实验室", path: "/labs" },
          { title: "新建" },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/labs")}>
            返回列表
          </Button>
        }
      />
      <ContentCard>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 640 }}
        onFinish={(values) => {
          createMutation.mutate({
            name: values.name,
            room_id: values.room_id,
            location_detail: values.location_detail,
            area_sqm: values.area_sqm,
            capacity: values.capacity,
            lab_type: values.lab_type as LabType,
            open_status: values.open_status as OpenStatus,
            description: values.description,
          });
        }}
      >
        <Form.Item name="name" label="实验室名称" rules={[{ required: true, message: "请输入名称" }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="building_id" label="楼栋">
          <Select
            allowClear
            options={buildingOptions}
            onChange={() => {
              form.setFieldsValue({ floor_id: undefined, room_id: undefined });
            }}
          />
        </Form.Item>
        <Form.Item name="floor_id" label="楼层">
          <Select
            allowClear
            options={floorOptions}
            disabled={!buildingId}
            onChange={() => form.setFieldValue("room_id", undefined)}
          />
        </Form.Item>
        <Form.Item name="room_id" label="房间">
          <Select allowClear options={roomOptions} disabled={!floorId} />
        </Form.Item>
        <Form.Item name="location_detail" label="具体位置">
          <Input maxLength={300} />
        </Form.Item>
        <Form.Item name="lab_type" label="实验室类型">
          <Select allowClear options={LAB_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="open_status" label="开放状态" initialValue="open">
          <Select options={OPEN_STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="area_sqm" label="面积(㎡)">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="capacity" label="容纳人数">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="description" label="备注">
          <Input.TextArea rows={3} maxLength={5000} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            创建
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate("/labs")}>
            取消
          </Button>
        </Form.Item>
      </Form>
      </ContentCard>
    </>
  );
}
