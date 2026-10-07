import { Column, Text } from "@once-ui-system/core";

type StatTileProps = {
  label: string;
  value: string;
  note?: string;
};

export function StatTile({ label, value, note }: StatTileProps) {
  return (
    <Column
      padding="20"
      gap="4"
      radius="l"
      border="neutral-alpha-weak"
      background="surface"
      fillWidth
    >
      <Text variant="label-default-s" onBackground="neutral-weak">
        {label}
      </Text>
      <Text variant="display-strong-s" onBackground="neutral-strong">
        {value}
      </Text>
      {note && (
        <Text variant="body-default-xs" onBackground="neutral-weak">
          {note}
        </Text>
      )}
    </Column>
  );
}
