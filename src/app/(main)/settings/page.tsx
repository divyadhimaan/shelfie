import { Card, Column, Heading } from "@once-ui-system/core";
import { ProfileForm } from "@/components/settings";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Settings · Shelfie" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  return (
    <Column maxWidth="xs" gap="24" paddingY="48" s={{ paddingY: "24" }}>
      <Heading as="h1" variant="display-strong-s">
        Settings
      </Heading>
      <Card
        direction="column"
        fillWidth
        padding="24"
        gap="16"
        radius="xl"
        border="neutral-alpha-medium"
      >
        <Heading as="h2" variant="heading-strong-m">
          Profile
        </Heading>
        <ProfileForm name={user.name ?? null} email={user.email ?? null} />
      </Card>
    </Column>
  );
}
