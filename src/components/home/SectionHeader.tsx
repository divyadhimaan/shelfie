import { Row, SmartLink, Text } from "@once-ui-system/core";

type SectionHeaderProps = {
  title: string;
  action?: { label: string; href: string };
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Row fillWidth horizontal="between" vertical="end" gap="12">
      <Text as="h2" variant="label-strong-m" onBackground="neutral-medium">
        {title}
      </Text>
      {action && (
        <SmartLink href={action.href}>
          <Text variant="label-default-s">{action.label}</Text>
        </SmartLink>
      )}
    </Row>
  );
}
