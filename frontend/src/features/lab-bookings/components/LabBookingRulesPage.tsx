import { DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, InputNumber, Popconfirm, Select, Space, Spin, TimePicker, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { ROLE_LABELS } from "@/features/users/api/usersApi";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { labBookingRulesApi, type BookingRuleCreate } from "../api/labBookingsApi";

const WEEKDAYS = [
  { key: "mon", label: "周一" },
  { key: "tue", label: "周二" },
  { key: "wed", label: "周三" },
  { key: "thu", label: "周四" },
  { key: "fri", label: "周五" },
  { key: "sat", label: "周六" },
  { key: "sun", label: "周日" },
];

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

type OpenHoursForm = Record<string, [dayjs.Dayjs, dayjs.Dayjs][]>;

function openHoursToForm(openHours: Record<string, unknown>): OpenHoursForm {
  const result: OpenHoursForm = {};
  for (const day of WEEKDAYS) {
    const slots = (openHours[day.key] as Array<{ start: string; end: string }>) ?? [];
    result[day.key] = slots.map((s) => [dayjs(s.start, "HH:mm"), dayjs(s.end, "HH:mm")]);
  }
  return result;
}

function formToOpenHours(form: OpenHoursForm): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const day of WEEKDAYS) {
    const slots = form[day.key]
      ?.filter((r) => r?.[0] && r?.[1])
      .map((r) => ({ start: r[0].format("HH:mm"), end: r[1].format("HH:mm") }));
    if (slots?.length) result[day.key] = slots;
  }
  return result;
}

export function LabBookingRulesPage() {
  const [labId, setLabId] = useState<string>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const { data: rule, isLoading, isError } = useQuery({
    queryKey: ["lab-booking-rule", labId],
    queryFn: () => labBookingRulesApi.get(labId!),
    enabled: !!labId,
    retry: false,
  });

  useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        allowed_roles: rule.allowed_roles ?? [],
        daily_limit: rule.daily_limit,
        ...openHoursToForm(rule.open_hours ?? {}),
      });
    } else if (labId) {
      form.resetFields();
    }
  }, [rule, labId, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const open_hours = formToOpenHours(values as OpenHoursForm);
      const payload: BookingRuleCreate = {
        lab_id: labId!,
        open_hours,
        allowed_roles: values.allowed_roles as string[],
        daily_limit: values.daily_limit as number | undefined,
      };
      if (rule) {
        return labBookingRulesApi.update(labId!, payload);
      }
      return labBookingRulesApi.create(payload);
    },
    onSuccess: () => {
      message.success("规则已保存");
      queryClient.invalidateQueries({ queryKey: ["lab-booking-rule", labId] });
    },
    onError: () => message.error("保存失败"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => labBookingRulesApi.delete(labId!),
    onSuccess: () => {
      message.success("规则已删除");
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["lab-booking-rule", labId] });
    },
    onError: () => message.error("删除失败"),
  });

  const labOptions = labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  return (
    <>
      <PageHeader subtitle="配置实验室开放时段、允许角色与每日预约上限" />

      <FilterBar>
        <Select
          placeholder="选择实验室"
          options={labOptions}
          style={{ width: 280 }}
          value={labId}
          onChange={setLabId}
        />
      </FilterBar>

      {!labId ? (
        <ContentCard>
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>请先选择实验室</div>
        </ContentCard>
      ) : isLoading ? (
        <Spin style={{ display: "block", margin: "48px auto" }} />
      ) : (
        <ContentCard
          title={isError ? "新建预约规则" : "编辑预约规则"}
          extra={
            rule ? (
              <Popconfirm title="确定删除此规则？" onConfirm={() => deleteMutation.mutate()}>
                <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                  删除规则
                </Button>
              </Popconfirm>
            ) : null
          }
        >
          <Form
            form={form}
            layout="vertical"
            style={{ maxWidth: 720 }}
            onFinish={(values) => saveMutation.mutate(values)}
          >
            {WEEKDAYS.map((day) => (
              <Form.Item key={day.key} name={day.key} label={`${day.label}开放时段`}>
                <TimePicker.RangePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            ))}
            <Form.Item name="allowed_roles" label="允许预约角色">
              <Select mode="multiple" options={ROLE_OPTIONS} placeholder="选择允许预约的角色" />
            </Form.Item>
            <Form.Item name="daily_limit" label="每日预约上限">
              <InputNumber min={1} style={{ width: 200 }} placeholder="不限制则留空" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saveMutation.isPending}>
                  保存规则
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </ContentCard>
      )}
    </>
  );
}
