import { PagePlaceholder } from "@/components/shell";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.library.title };

export default function LibraryPage() {
  return (
    <PagePlaceholder
      title="Library"
      description="Every book you've read, are reading or want to read, with filters by year, genre, rating and format."
      requirements={["TRK-1", "TRK-2", "TRK-5", "TRK-8"]}
    />
  );
}
