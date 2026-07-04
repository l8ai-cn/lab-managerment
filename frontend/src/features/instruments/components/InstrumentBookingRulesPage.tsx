import { SaveOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Form,
  InputNumber,
  Select,
  Spin,
  Switch,
  TimePicker,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { ContentCard } from "@/shared/components/ContentCard";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  instrumentBookingRulesApi,
  instrumentsApi,
  type InstrumentBookingRuleCreate,
} from "../api/instrumentsApi";

const WEEKDAYS = [
  { key: "mon", label: "周一" },
  { key: "tue", label: "周二" },
  { key: "wed", label: "周三" },
  { key: "thu", label: "周四" },
  { key: "fri", label: "周五" },
  { key: "sat", label: "周六" },
  { key: "sun", label: "周日" },
];

function openHoursToForm(openHours: Record<string, unknown>) {
  const result: Record<string, [dayjs.Dayjs, dayjs.Dayjs] | null> = {};
  for (const day of WEEKDAYS) {
    const slots = (openHours[day.key] as Array<{ start: string; end: string }>) ?? [];
    const first = slots[0];
    result[day.key] = first
      ? [dayjs(first.start, "HH:mm"), dayjs(first.end, "HH:mm")]
      : null;
  }
  return result;
}

function formToOpenHours(form: Record<string, [dayjs.Dayjs, dayjs.Dayjs] | null>) {
  const result: Record<string, unknown> = {};
  for (const day of WEEKDAYS) {
    const range = form[day.key];
    if (range?.[0] && range?.[1]) {
      result[day.key] = [{ start: range[0].format("HH:mm"), end: range[1].format("HH:mm") }];
    }
  }
  return result;
}

export function InstrumentBookingRulesPage() {
  const [instrumentId, setInstrumentId] = useState<string>();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: instrumentsData } = useQuery({
    queryKey: ["instruments-options"],
    queryFn: () => instrumentsApi.list({ page_size: 100 }),
  });

  const { data: rule, isLoading } = useQuery({
    queryKey: ["instrument-booking-rule", instrumentId],
    queryFn: () => instrumentBookingRulesApi.get(instrumentId!),
    enabled: !!instrumentId,
    retry: false,
  });

  useEffect(() => {
    if (rule) {
      form.setFieldsValue({
        min_duration_minutes: rule.min_duration_minutes ?? 30,
        max_duration_minutes: rule.max_duration_minutes ?? 480,
        daily_limit: rule.daily_limit,
        weekly_limit: rule.weekly_limit,
        advance_hours: rule.advance_hours ?? 24,
        approval_mode: rule.approval_mode ?? "manager",
        is_active: rule.is_active ?? true,
        ...openHoursToForm(rule.open_hours ?? {}),
      });
    } else if (instrumentId) {
      form.resetFields();
      form.setFieldsValue({ min_duration_minutes: 30, max_duration_minutes: 480, advance_hours: 24, is_active: true });
    }
  }, [rule, instrumentId, form]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const open_hours = formToOpenHours(values as Record<string, [dayjs.Dayjs, dayjs.Dayjs] | null>);
      const payload: InstrumentBookingRuleCreate = {
        instrument_id: instrumentId!,
        open_hours,
        min_duration_minutes: values.min_duration_minutes as number,
        max_duration_minutes: values.max_duration_minutes as number,
        daily_limit: values.daily_limit as number | undefined,
        weekly_limit: values.weekly_limit as number | undefined,
        advance_hours: values.advance_hours as number,
        approval_mode: values.approval_mode as string,
        is_active: values.is_active as boolean,
      };
      return instrumentBookingRulesApi.set(payload);
    },
    onSuccess: () => {
      message.success("规则已保存");
      queryClient.invalidateQueries({ queryKey: ["instrument-booking-rule", instrumentId] });
    },
    onError: () => message.error("保存失败"),
  });

  const instrumentOptions =
    instrumentsData?.items.map((i) => ({ value: i.id, label: `${i.code} ${i.name}` })) ?? [];

  return (
    <>
      <PageHeader subtitle="配置仪器开放时段、时长限制与审批模式" />

      <FilterBar>
        <Select
          placeholder="选择仪器"
          options={instrumentOptions}
          style={{ width: 320 }}
          value={instrumentId}
          onChange={setInstrumentId}
        />
      </FilterBar>

      {!instrumentId ? (
        <ContentCard>
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>请先选择仪器</div>
        </ContentCard>
      ) : isLoading ? (
        <Spin style={{ display: "block", margin: "48px auto" }} />
      ) : (
        <ContentCard title="仪器预约规则">
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
            <Form.Item name="min_duration_minutes" label="最短预约时长(分钟)">
              <InputNumber min={15} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="max_duration_minutes" label="最长预约时长(分钟)">
              <InputNumber min={30} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="daily_limit" label="每日预约上限">
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="weekly_limit" label="每周预约上限">
              <InputNumber min={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="advance_hours" label="提前预约时间(小时)">
              <InputNumber min={0} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="approval_mode" label="审批模式">
              <Select
                options={[
                  { value: "manager", label: "管理员审批" },
                  { value: "auto", label: "自动通过" },
                ]}
                style={{ width: 200 }}
              />
            </Form.Item>
            <Form.Item name="is_active" label="启用规则" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saveMutation.isPending}>
                保存规则
              </Button>
            </Form.Item>
          </Form>
        </ContentCard>
      )}
    </>
  );
}
