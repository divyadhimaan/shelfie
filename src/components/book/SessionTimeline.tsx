import { Column, Row, Text } from "@once-ui-system/core";
import type { BookSession } from "@/lib/library/book";

function dayLabel(date: string, today: string) {
  if (date === today) return "Today";
  const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (date === yesterday) return "Yesterday";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

type SessionTimelineProps = {
  sessions: BookSession[];
  startedAt: string | null;
  today: string;
};

/** Each logged update, newest first, with the pages gained that day. */
export function SessionTimeline({ sessions, startedAt, today }: SessionTimelineProps) {
  return (
    <Column as="ol" gap="0" margin="0" padding="0" style={{ listStyle: "none" }}>
      {sessions.map((s, i) => (
        <Row
          as="li"
          key={`${s.date}-${i}`}
          gap="12"
          paddingY="12"
          vertical="center"
          borderBottom="neutral-alpha-weak"
        >
          <Row
            radius="full"
            solid={i === 0 ? "brand-strong" : undefined}
            background={i === 0 ? undefined : "neutral-alpha-medium"}
            style={{ width: "0.5rem", height: "0.5rem", flexShrink: 0 }}
          />
          <Text variant="body-default-s" onBackground="neutral-strong" style={{ flex: 1 }}>
            {s.page !== null ? `Page ${s.page}` : `${s.percent}%`}
          </Text>
          <Text variant="label-default-s" onBackground="neutral-weak">
            {dayLabel(s.date, today)}
            {s.gained > 0 ? ` · +${s.gained} pages` : ""}
          </Text>
        </Row>
      ))}
      {startedAt && (
        <Row as="li" gap="12" paddingY="12" vertical="center">
          <Row
            radius="full"
            background="neutral-alpha-medium"
            style={{ width: "0.5rem", height: "0.5rem", flexShrink: 0 }}
          />
          <Text variant="body-default-s" onBackground="neutral-strong" style={{ flex: 1 }}>
            Started
          </Text>
          <Text variant="label-default-s" onBackground="neutral-weak">
            {dayLabel(startedAt, today)}
          </Text>
        </Row>
      )}
    </Column>
  );
}
