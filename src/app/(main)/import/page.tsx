import { Column, Heading, Text } from "@once-ui-system/core";
import { ImportFlow } from "@/components/import";
import { getImportView } from "@/lib/import/service";
import { requireUser } from "@/lib/session";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.import.title };

export default async function ImportPage() {
  const user = await requireUser("/import");
  const view = await getImportView(user.id);

  return (
    <Column maxWidth="s" gap="32" paddingY="64" s={{ paddingY: "32" }}>
      <Column gap="12">
        <Heading as="h1" variant="display-strong-s">
          Import from Goodreads
        </Heading>
        <Text variant="body-default-l" onBackground="neutral-weak" wrap="balance">
          Bring your reading history into Shelfie once. After that, track new books here.
        </Text>
      </Column>
      <ImportFlow view={view} />
    </Column>
  );
}
