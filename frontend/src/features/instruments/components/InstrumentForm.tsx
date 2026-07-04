import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Modal, Select, message } from "antd";
import { useEffect } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { instrumentsApi, type Instrument, type InstrumentCreate } from "../api/instrumentsApi";

interface InstrumentFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Instrument | null;
}

export function InstrumentForm({ open, onClose, editing }: InstrumentFormProps) {
  const [form] = Form.useForm<InstrumentCreate>();
  const queryClient = useQueryClient();

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  useEffect(() => {
    if (open && editing) {
      form.setFieldsValue({
        name: editing.name,
        model: editing.model,
        manufacturer: editing.manufacturer,
        serial_no: editing.serial_no,
        asset_no: editing.asset_no,
        category: editing.category,
        lab_id: editing.lab_id,
        location: editing.location,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, editing, form]);

  const saveMutation = useMutation({
    mutationFn: (values: InstrumentCreate) =>
      editing ? instrumentsApi.update(editing.id, values) : instrumentsApi.create(values),
    onSuccess: () => {
      message.success(editing ? "更新成功" : "创建成功");
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
      onClose();
      form.resetFields();
    },
    onError: () => message.error("保存失败"),
  });

  const labOptions =
    labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  return (
    <Modal
      title={editing ? "编辑仪器" : "新增仪器"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saveMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(v) => saveMutation.mutate(v)}>
        <Form.Item name="name" label="仪器名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="model" label="型号">
          <Input />
        </Form.Item>
        <Form.Item name="manufacturer" label="生产厂家">
          <Input />
        </Form.Item>
        <Form.Item name="serial_no" label="序列号">
          <Input />
        </Form.Item>
        <Form.Item name="asset_no" label="资产编号">
          <Input />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Input />
        </Form.Item>
        <Form.Item name="lab_id" label="所属实验室">
          <Select allowClear options={labOptions} placeholder="选择实验室" />
        </Form.Item>
        <Form.Item name="location" label="存放位置">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
