import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Select, Spin, Tag } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { FilterBar } from "@/shared/components/FilterBar";
import { instrumentBookingsApi, instrumentsApi } from "../api/instrumentsApi";

const STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
  in_use: "cyan",
  available: "default",
  booked: "orange",
};

export function InstrumentBookingCalendar() {
  const [instrumentId, setInstrumentId] = useState<string>();
  const [month, setMonth] = useState(dayjs());

  const { data: instrumentsData } = useQuery({
    queryKey: ["instruments-options"],
    queryFn: () => instrumentsApi.list({ page_size: 100 }),
  });

  const fromTime = month.startOf("month").toISOString();
  const toTime = month.endOf("month").toISOString();

  const { data: slots, isLoading } = useQuery({
    queryKey: ["instrument-bookings-calendar", instrumentId, fromTime],
    queryFn: () => instrumentBookingsApi.calendar(instrumentId!, fromTime, toTime),
    enabled: !!instrumentId,
  });

  const instrumentOptions =
    instrumentsData?.items.map((i) => ({ value: i.id, label: `${i.code} ${i.name}` })) ?? [];

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
          placeholder="选择仪器查看日历"
          allowClear
          options={instrumentOptions}
          style={{ width: 280 }}
          value={instrumentId}
          onChange={setInstrumentId}
        />
      </FilterBar>

      {!instrumentId ? (
        <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>请先选择仪器</div>
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
