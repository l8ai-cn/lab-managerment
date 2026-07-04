import { ArrowLeftOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Select, Spin, message } from "antd";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import { labsApi, spacesApi } from "../api/labsApi";
import { usersApi } from "@/features/users/api/usersApi";
import { LAB_TYPE_LABELS, OPEN_STATUS_LABELS, type BuildingTree, type LabType, type OpenStatus } from "../types/lab";

const LAB_TYPE_OPTIONS = Object.entries(LAB_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const OPEN_STATUS_OPTIONS = Object.entries(OPEN_STATUS_LABELS).map(([value, label]) => ({ value, label }));

interface LabFormFieldsProps {
  labId?: string;
}

export function LabFormFields({ labId }: LabFormFieldsProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!labId;

  const { data: tree } = useQuery({
    queryKey: ["building-tree"],
    queryFn: spacesApi.getTree,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-manager-options"],
    queryFn: () => usersApi.list({ page_size: 100, role: "lab_admin" }),
  });

  const { data: lab, isLoading } = useQuery({
    queryKey: ["lab", labId],
    queryFn: () => labsApi.get(labId!),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: labsApi.create,
    onSuccess: (data) => {
      message.success("实验室创建成功");
      navigate(`/labs/${data.id}`);
    },
    onError: () => message.error("创建失败"),
  });

  const updateMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => labsApi.update(labId!, values),
    onSuccess: () => {
      message.success("更新成功");
      navigate(`/labs/${labId}`);
    },
    onError: () => message.error("更新失败"),
  });

  const buildingId = Form.useWatch("building_id", form);
  const floorId = Form.useWatch("floor_id", form);

  useEffect(() => {
    if (!lab || !tree) return;
    let matchedBuilding: string | undefined;
    let matchedFloor: string | undefined;
    for (const b of tree as BuildingTree[]) {
      for (const f of b.floors) {
        if (f.rooms.some((r: { id: string }) => r.id === lab.room_id)) {
          matchedBuilding = b.id;
          matchedFloor = f.id;
        }
      }
    }
    form.setFieldsValue({
      name: lab.name,
      building_id: matchedBuilding,
      floor_id: matchedFloor,
      room_id: lab.room_id,
      location_detail: lab.location_detail,
      area_sqm: lab.area_sqm,
      capacity: lab.capacity,
      lab_type: lab.lab_type,
      open_status: lab.open_status,
      manager_id: lab.manager_id,
      description: lab.description,
    });
  }, [lab, tree, form]);

  const buildingOptions = (tree as BuildingTree[] | undefined)?.map((b) => ({ value: b.id, label: b.name })) ?? [];
  const floorOptions =
    (tree as BuildingTree[] | undefined)?.find((b) => b.id === buildingId)?.floors.map((f) => ({ value: f.id, label: f.name })) ?? [];
  const roomOptions =
    (tree as BuildingTree[] | undefined)
      ?.find((b) => b.id === buildingId)
      ?.floors.find((f) => f.id === floorId)
      ?.rooms.map((r) => ({ value: r.id, label: r.code ? `${r.name}(${r.code})` : r.name })) ?? [];

  const managerOptions =
    usersData?.items.map((u) => ({ value: u.id, label: `${u.name} (${u.username})` })) ?? [];

  if (isEdit && isLoading) {
    return <Spin style={{ display: "block", margin: "48px auto" }} />;
  }

  return (
    <>
      <PageHeader
        title={isEdit ? "编辑实验室" : "新建实验室"}
        breadcrumb={[
          { title: "实验室管理" },
          { title: "实验室", path: "/labs" },
          { title: isEdit ? (lab?.code ?? "编辑") : "新建" },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(isEdit ? `/labs/${labId}` : "/labs")}>
            返回
          </Button>
        }
      />
      <ContentCard>
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 640 }}
          onFinish={(values) => {
            const payload = {
              name: values.name,
              room_id: values.room_id,
              location_detail: values.location_detail,
              area_sqm: values.area_sqm,
              capacity: values.capacity,
              lab_type: values.lab_type as LabType,
              open_status: values.open_status as OpenStatus,
              manager_id: values.manager_id,
              description: values.description,
            };
            if (isEdit) {
              updateMutation.mutate(payload);
            } else {
              createMutation.mutate(payload);
            }
          }}
        >
          <Form.Item name="name" label="实验室名称" rules={[{ required: true, message: "请输入名称" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="building_id" label="楼栋">
            <Select
              allowClear
              options={buildingOptions}
              onChange={() => form.setFieldsValue({ floor_id: undefined, room_id: undefined })}
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
          <Form.Item name="manager_id" label="实验室管理员">
            <Select allowClear options={managerOptions} placeholder="选择管理员" />
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
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEdit ? "保存" : "创建"}
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate(isEdit ? `/labs/${labId}` : "/labs")}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </ContentCard>
    </>
  );
}

export function LabForm() {
  return <LabFormFields />;
}

export function LabEditPage() {
  const { id } = useParams<{ id: string }>();
  return <LabFormFields labId={id} />;
}
