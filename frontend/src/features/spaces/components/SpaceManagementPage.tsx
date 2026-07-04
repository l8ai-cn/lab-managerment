import { PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Modal, Table, message } from "antd";
import { useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { PageHeader } from "@/shared/components/PageHeader";
import type { BuildingTree } from "@/features/labs/types/lab";
import { spacesApi } from "../api/spacesApi";

export function SpaceManagementPage() {
  const [buildingModal, setBuildingModal] = useState(false);
  const [floorModal, setFloorModal] = useState<{ buildingId: string; buildingName: string } | null>(null);
  const [roomModal, setRoomModal] = useState<{ floorId: string; floorName: string } | null>(null);
  const [buildingForm] = Form.useForm();
  const [floorForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: tree, isLoading } = useQuery({
    queryKey: ["building-tree"],
    queryFn: spacesApi.getTree,
  });

  const createBuilding = useMutation({
    mutationFn: spacesApi.createBuilding,
    onSuccess: () => {
      message.success("楼栋已创建");
      setBuildingModal(false);
      buildingForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["building-tree"] });
    },
    onError: () => message.error("创建失败"),
  });

  const createFloor = useMutation({
    mutationFn: spacesApi.createFloor,
    onSuccess: () => {
      message.success("楼层已创建");
      setFloorModal(null);
      floorForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["building-tree"] });
    },
    onError: () => message.error("创建失败"),
  });

  const createRoom = useMutation({
    mutationFn: spacesApi.createRoom,
    onSuccess: () => {
      message.success("房间已创建");
      setRoomModal(null);
      roomForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["building-tree"] });
    },
    onError: () => message.error("创建失败"),
  });

  const tableData =
    (tree as BuildingTree[] | undefined)?.flatMap((b) =>
      b.floors.length
        ? b.floors.flatMap((f) =>
            f.rooms.length
              ? f.rooms.map((r) => ({
                  key: r.id,
                  building: b.name,
                  buildingId: b.id,
                  floor: f.name,
                  floorId: f.id,
                  floorNumber: f.floor_number,
                  room: r.name,
                  roomCode: r.code ?? "-",
                }))
              : [
                  {
                    key: f.id,
                    building: b.name,
                    buildingId: b.id,
                    floor: f.name,
                    floorId: f.id,
                    floorNumber: f.floor_number,
                    room: "-",
                    roomCode: "-",
                  },
                ],
          )
        : [
            {
              key: b.id,
              building: b.name,
              buildingId: b.id,
              floor: "-",
              floorId: "",
              floorNumber: 0,
              room: "-",
              roomCode: "-",
            },
          ],
    ) ?? [];

  const columns = [
    { title: "楼栋", dataIndex: "building", width: 140 },
    { title: "楼层", dataIndex: "floor", width: 100 },
    { title: "房间", dataIndex: "room", width: 120 },
    { title: "房间编号", dataIndex: "roomCode", width: 100 },
    {
      title: "操作",
      width: 200,
      render: (_: unknown, record: (typeof tableData)[0]) => (
        <>
          <Button
            type="link"
            size="small"
            onClick={() =>
              setFloorModal({ buildingId: record.buildingId, buildingName: record.building })
            }
          >
            添加楼层
          </Button>
          {record.floorId && (
            <Button
              type="link"
              size="small"
              onClick={() => setRoomModal({ floorId: record.floorId, floorName: record.floor })}
            >
              添加房间
            </Button>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBuildingModal(true)}>
            新增楼栋
          </Button>
        }
      />

      <ContentCard noPadding>
        <Table rowKey="key" loading={isLoading} columns={columns} dataSource={tableData} pagination={false} />
      </ContentCard>

      <Modal
        title="新增楼栋"
        open={buildingModal}
        onCancel={() => setBuildingModal(false)}
        onOk={() => buildingForm.submit()}
        confirmLoading={createBuilding.isPending}
        destroyOnClose
      >
        <Form form={buildingForm} layout="vertical" onFinish={(v) => createBuilding.mutate(v)}>
          <Form.Item name="name" label="楼栋名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="楼栋编号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`新增楼层 — ${floorModal?.buildingName}`}
        open={!!floorModal}
        onCancel={() => setFloorModal(null)}
        onOk={() => floorForm.submit()}
        confirmLoading={createFloor.isPending}
        destroyOnClose
      >
        <Form
          form={floorForm}
          layout="vertical"
          onFinish={(v) => {
            if (!floorModal) return;
            createFloor.mutate({
              building_id: floorModal.buildingId,
              name: v.name,
              floor_number: v.floor_number,
            });
          }}
        >
          <Form.Item name="name" label="楼层名称" rules={[{ required: true }]}>
            <Input placeholder="如 1F、2F" />
          </Form.Item>
          <Form.Item name="floor_number" label="楼层序号" rules={[{ required: true }]}>
            <InputNumber min={-5} max={99} style={{ width: "100%" }} placeholder="1=一层" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`新增房间 — ${roomModal?.floorName}`}
        open={!!roomModal}
        onCancel={() => setRoomModal(null)}
        onOk={() => roomForm.submit()}
        confirmLoading={createRoom.isPending}
        destroyOnClose
      >
        <Form
          form={roomForm}
          layout="vertical"
          onFinish={(v) => {
            if (!roomModal) return;
            createRoom.mutate({ floor_id: roomModal.floorId, ...v });
          }}
        >
          <Form.Item name="name" label="房间名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="房间编号">
            <Input />
          </Form.Item>
          <Form.Item name="area_sqm" label="面积(㎡)">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
