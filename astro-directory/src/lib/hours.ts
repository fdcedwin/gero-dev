export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Day = (typeof DAYS)[number];
export type DayHours = "closed" | { open: string; close: string };
export type WeeklyHours = Record<Day, DayHours>;

/** "06:30" -> "6:30am", "15:00" -> "3:00pm", "00:00" -> "12:00am" */
export function formatTime(value: string): string {
  const [h = 0, m = 0] = value.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatDayHours(hours: DayHours): string {
  return hours === "closed" ? "Closed" : `${formatTime(hours.open)} — ${formatTime(hours.close)}`;
}

export function dayLabel(day: Day): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/** schema.org OpeningHoursSpecification entries, skipping closed days. */
export function toOpeningHoursSpecification(hours: WeeklyHours) {
  return DAYS.flatMap((day) => {
    const value = hours[day];
    if (value === "closed") return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${dayLabel(day)}`,
        opens: value.open,
        closes: value.close,
      },
    ];
  });
}
