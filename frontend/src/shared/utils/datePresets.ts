import dayjs from "dayjs";

export type TimePreset = "week" | "month" | "semester" | "year" | "all";

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  week: "本周",
  month: "本月",
  semester: "本学期",
  year: "本学年",
  all: "全部",
};

function currentSemesterRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1;
  if (month >= 2 && month <= 7) {
    return [dayjs(`${year}-02-01`), dayjs(`${year}-07-31`)];
  }
  if (month >= 8) {
    return [dayjs(`${year}-08-01`), dayjs(`${year + 1}-01-31`)];
  }
  return [dayjs(`${year - 1}-08-01`), dayjs(`${year}-01-31`)];
}

function currentAcademicYearRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();
  const year = now.month() >= 8 ? now.year() : now.year() - 1;
  return [dayjs(`${year}-08-01`), dayjs(`${year + 1}-07-31`)];
}

export function getDateRangeForPreset(preset: TimePreset): [dayjs.Dayjs, dayjs.Dayjs] | null {
  const now = dayjs();
  switch (preset) {
    case "week":
      return [now.startOf("week"), now.endOf("week")];
    case "month":
      return [now.startOf("month"), now.endOf("month")];
    case "semester":
      return currentSemesterRange();
    case "year":
      return currentAcademicYearRange();
    case "all":
      return null;
  }
}
