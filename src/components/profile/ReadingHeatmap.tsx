import { Column, Row, Text } from "@once-ui-system/core";
import type { ActivityDay } from "@/lib/reading/activity";
import styles from "./ReadingHeatmap.module.scss";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const describe = (day: ActivityDay) => {
  const date = new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  if (day.level === 0) return `${date}: no reading`;
  return day.pages > 0 ? `${date}: ${day.pages} pages` : `${date}: read`;
};

/** A year of reading days, Monday-first weeks as columns (GitHub-style). */
export function ReadingHeatmap({
  weeks,
  readingDays,
}: { weeks: ActivityDay[][]; readingDays: number }) {
  // A month label sits above the first week that starts in that month.
  const labels = weeks.map((week, i) => {
    const month = Number(week[0].date.slice(5, 7)) - 1;
    const previous = i > 0 ? Number(weeks[i - 1][0].date.slice(5, 7)) - 1 : -1;
    return month !== previous ? MONTHS[month] : "";
  });

  return (
    <Column gap="12" style={{ overflowX: "auto" }} paddingBottom="4">
      <Column gap="4" fillWidth style={{ ["--weeks" as string]: weeks.length }}>
        <div className={styles.months} aria-hidden>
          {labels.map((label, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: one label slot per week column
            <Text
              key={i}
              variant="label-default-xs"
              onBackground="neutral-weak"
              className={styles.month}
            >
              {label}
            </Text>
          ))}
        </div>
        <div
          className={styles.grid}
          role="img"
          aria-label={`Reading days over the last year: ${readingDays} days with reading`}
        >
          {weeks.flat().map((day) => (
            <span
              key={day.date}
              className={styles.cell}
              data-level={day.level}
              data-future={day.future}
              title={day.future ? undefined : describe(day)}
            />
          ))}
        </div>
      </Column>
      <Row gap="4" vertical="center" aria-hidden>
        <Text variant="label-default-xs" onBackground="neutral-weak" marginRight="4">
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <span key={level} className={`${styles.cell} ${styles.legend}`} data-level={level} />
        ))}
        <Text variant="label-default-xs" onBackground="neutral-weak" marginLeft="4">
          More
        </Text>
      </Row>
    </Column>
  );
}
