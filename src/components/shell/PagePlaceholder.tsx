import { Badge, Column, Heading, Row, Text } from "@once-ui-system/core";

type PagePlaceholderProps = {
  title: string;
  description: string;
  /** Requirement IDs from docs/requirements.md that this page will implement. */
  requirements: string[];
};

// Temporary page body until each MVP feature is built.
export function PagePlaceholder({ title, description, requirements }: PagePlaceholderProps) {
  return (
    <Column maxWidth="m" gap="16" paddingY="64" s={{ paddingY: "32" }}>
      <Heading as="h1" variant="display-strong-s">
        {title}
      </Heading>
      <Text variant="body-default-l" onBackground="neutral-weak" wrap="balance">
        {description}
      </Text>
      <Column gap="8" marginTop="16">
        <Text variant="label-default-s" onBackground="neutral-medium">
          Planned in MVP
        </Text>
        <Row gap="8" wrap>
          {requirements.map((id) => (
            <Badge
              key={id}
              textVariant="code-default-s"
              onBackground="neutral-medium"
              border="neutral-alpha-medium"
            >
              {id}
            </Badge>
          ))}
        </Row>
      </Column>
    </Column>
  );
}
