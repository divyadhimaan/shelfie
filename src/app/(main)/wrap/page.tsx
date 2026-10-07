import { PagePlaceholder } from "@/components/shell";
import { meta } from "@/resources/seo";

export const metadata = { title: meta.wrap.title };

export default function WrapPage() {
  return (
    <PagePlaceholder
      title="Year Shelfie"
      description="Your reading year as a sequence of story cards, exported as PNGs sized for Instagram Stories, Reels and feed posts."
      requirements={["WRP-1", "WRP-2", "WRP-4", "SHR-1", "SHR-2", "SHR-3"]}
    />
  );
}
