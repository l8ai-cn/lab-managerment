import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { usersApi } from "@/features/users/api/usersApi";
import { instrumentsApi, type Instrument, type InstrumentCreate } from "../api/instrumentsApi";

interface InstrumentFormProps {
  open: boolean;
  onClose: () => void;
  editing?: Instrument | null;
}

interface InstrumentFormValues extends Omit<InstrumentCreate, "purchase_date"> {
  purchase_date?: dayjs.Dayjs;
}

export function InstrumentForm({ open, onClose, editing }: InstrumentFormProps) {
  const [form] = Form.useForm<InstrumentFormValues>();
  const queryClient = useQueryClient();

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-manager-options"],
    queryFn: () => usersApi.list({ page_size: 100, role: "lab_admin" }),
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
        manager_id: editing.manager_id,
        purchase_date: editing.purchase_date ? dayjs(editing.purchase_date) : undefined,
        purchase_price: editing.purchase_price,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, editing, form]);

  const saveMutation = useMutation({
    mutationFn: (values: InstrumentFormValues) => {
      const payload: InstrumentCreate = {
        ...values,
        purchase_date: values.purchase_date?.toISOString(),
      };
      return editing ? instrumentsApi.update(editing.id, payload) : instrumentsApi.create(payload);
    },
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

  const managerOptions =
    usersData?.items.map((u) => ({ value: u.id, label: `${u.name} (${u.username})` })) ?? [];

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
        <Form.Item name="manager_id" label="管理员">
          <Select allowClear options={managerOptions} placeholder="选择管理员" />
        </Form.Item>
        <Form.Item name="purchase_date" label="购置日期">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="purchase_price" label="购置价格(元)">
          <InputNumber min={0} precision={2} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="location" label="存放位置">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
