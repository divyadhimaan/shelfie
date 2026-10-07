import { Column, Row, Text } from "@once-ui-system/core";

type RankedBarsProps = {
  title: string;
  items: { name: string; count: number }[];
  unit: string;
  emptyText: string;
};

/** A ranked list with an inline bar per row; values are printed, so nothing depends on hover. */
export function RankedBars({ title, items, unit, emptyText }: RankedBarsProps) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <Column
      gap="16"
      padding="20"
      radius="l"
      border="neutral-alpha-weak"
      background="surface"
      fillWidth
    >
      <Text as="h2" variant="heading-strong-s">
        {title}
      </Text>
      {items.length === 0 ? (
        <Text variant="body-default-s" onBackground="neutral-weak">
          {emptyText}
        </Text>
      ) : (
        <Column as="ol" gap="12" margin="0" padding="0" style={{ listStyle: "none" }}>
          {items.map((item) => (
            <Column as="li" key={item.name} gap="4">
              <Row horizontal="between" gap="12">
                <Text variant="body-default-s" onBackground="neutral-strong">
                  {item.name}
                </Text>
                <Text
                  variant="body-default-s"
                  onBackground="neutral-weak"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {item.count} {item.count === 1 ? unit : `${unit}s`}
                </Text>
              </Row>
              <Row
                fillWidth
                height="8"
                radius="full"
                background="neutral-alpha-weak"
                overflow="hidden"
              >
                <Row
                  fillHeight
                  radius="full"
                  style={{
                    width: `${(item.count / max) * 100}%`,
                    // Same validated chart color as the column charts.
                    background: "var(--shelfie-chart)",
                  }}
                />
              </Row>
            </Column>
          ))}
        </Column>
      )}
    </Column>
  );
}
