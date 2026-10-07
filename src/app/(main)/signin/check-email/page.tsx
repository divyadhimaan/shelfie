import { Button, Card, Column, Heading, Icon, Text } from "@once-ui-system/core";
import { emailLinksLoggedOnly } from "@/auth";

export const metadata = { title: "Check your email · Shelfie" };

export default function CheckEmailPage() {
  return (
    <Column fillWidth horizontal="center" paddingY="80" s={{ paddingY: "32" }}>
      <Column maxWidth={26}>
        <Card
          direction="column"
          fillWidth
          padding="32"
          gap="16"
          radius="xl"
          border="neutral-alpha-medium"
          s={{ padding: "24" }}
        >
          <Icon name="mail" size="l" onBackground="brand-strong" />
          <Heading as="h1" variant="display-strong-xs">
            Check your email
          </Heading>
          <Text variant="body-default-m" onBackground="neutral-weak">
            We sent you a sign-in link. It works once and expires in 24 hours.
          </Text>
          {emailLinksLoggedOnly && (
            <Column background="warning-alpha-weak" padding="12" radius="m">
              <Text variant="body-default-s" onBackground="warning-strong">
                Development mode: no email is sent because AUTH_RESEND_KEY isn&apos;t set. Open the
                sign-in link printed in the dev server log.
              </Text>
            </Column>
          )}
          <Button href="/signin" variant="tertiary" size="m">
            Use a different email
          </Button>
        </Card>
      </Column>
    </Column>
  );
}
