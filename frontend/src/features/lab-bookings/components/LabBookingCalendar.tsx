import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Select, Spin, Tag } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { labsApi } from "@/features/labs/api/labsApi";
import { FilterBar } from "@/shared/components/FilterBar";
import { labBookingsApi } from "../api/labBookingsApi";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
  free: "default",
};

export function LabBookingCalendar() {
  const [labId, setLabId] = useState<string>();
  const [month, setMonth] = useState(dayjs());

  const { data: labsData } = useQuery({
    queryKey: ["labs-options"],
    queryFn: () => labsApi.list({ page_size: 100 }),
  });

  const fromTime = month.startOf("month").toISOString();
  const toTime = month.endOf("month").toISOString();

  const { data: slots, isLoading } = useQuery({
    queryKey: ["lab-bookings-calendar", labId, fromTime],
    queryFn: () => labBookingsApi.calendar(labId!, fromTime, toTime),
    enabled: !!labId,
  });

  const labOptions = labsData?.items.map((l) => ({ value: l.id, label: `${l.code} ${l.name}` })) ?? [];

  const slotsByDay = new Map<string, typeof slots>();
  slots?.forEach((slot) => {
    const key = dayjs(slot.start_time).format("YYYY-MM-DD");
    if (!slotsByDay.has(key)) slotsByDay.set(key, []);
    slotsByDay.get(key)!.push(slot);
  });

  const dateCellRender = (date: Dayjs) => {
    const key = date.format("YYYY-MM-DD");
    const daySlots = slotsByDay.get(key);
    if (!daySlots?.length) return null;
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 11 }}>
        {daySlots.slice(0, 3).map((s, i) => (
          <li key={i}>
            <Tag color={STATUS_COLORS[s.status] ?? "default"} style={{ fontSize: 10, marginBottom: 2 }}>
              {dayjs(s.start_time).format("HH:mm")}-{dayjs(s.end_time).format("HH:mm")}
            </Tag>
          </li>
        ))}
        {daySlots.length > 3 && <li>+{daySlots.length - 3} 更多</li>}
      </ul>
    );
  };

  return (
    <>
      <FilterBar>
        <Select
          placeholder="选择实验室查看日历"
          allowClear
          options={labOptions}
          style={{ width: 280 }}
          value={labId}
          onChange={setLabId}
        />
      </FilterBar>

      {!labId ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>请先选择实验室</div>
      ) : isLoading ? (
        <Spin style={{ display: "block", margin: "48px auto" }} />
      ) : (
        <Calendar
          value={month}
          onPanelChange={(v) => setMonth(v)}
          cellRender={(date, info) => (info.type === "date" ? dateCellRender(date) : info.originNode)}
        />
      )}
    </>
  );
}
