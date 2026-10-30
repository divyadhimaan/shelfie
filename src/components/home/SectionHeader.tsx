import { Heading, Row, SmartLink, Text } from "@once-ui-system/core";

type SectionHeaderProps = {
  title: string;
  action?: { label: string; href: string };
};

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <Row fillWidth horizontal="between" vertical="end" gap="12">
      <Heading as="h2" variant="heading-default-xl" onBackground="neutral-strong">
        {title}
      </Heading>
      {action && (
        <SmartLink href={action.href}>
          <Text variant="label-default-s" onBackground="neutral-weak">
            {action.label}
          </Text>
        </SmartLink>
      )}
    </Row>
  );
}
