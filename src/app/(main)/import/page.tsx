import { PagePlaceholder } from "@/components/shell";
import { requireUser } from "@/lib/session";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.import.title };

export default async function ImportPage() {
  await requireUser("/import");

  return (
    <PagePlaceholder
      title="Import from Goodreads"
      description="Upload the CSV from Goodreads (My Books → Import and export). Shelfie matches each book, fills in covers and genres, and lets you review everything before it's saved."
      requirements={["IMP-1", "IMP-2", "IMP-3", "IMP-4", "IMP-5", "IMP-6", "IMP-7", "CAT-1", "CAT-2", "CAT-3"]}
    />
  );
}
