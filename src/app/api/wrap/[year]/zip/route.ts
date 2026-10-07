import { zipSync } from "fflate";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isCardSize } from "@/lib/wrap/build";
import { displayName, getWrap } from "@/lib/wrap/data";
import { renderCard } from "@/lib/wrap/render";

export const runtime = "nodejs";

/** GET /api/wrap/2026/zip?size=story → every card in the wrap as PNGs in one zip (SHR-3). */
export async function GET(request: Request, { params }: { params: Promise<{ year: string }> }) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to see your wrap." }, { status: 401 });

  const year = Number((await params).year);
  const size = new URL(request.url).searchParams.get("size");
  if (!Number.isInteger(year) || !isCardSize(size)) {
    return NextResponse.json({ error: "Unknown year or size." }, { status: 400 });
  }

  const { cards } = await getWrap(userId, year, displayName(session.user ?? {}));
  if (cards.length === 0)
    return NextResponse.json({ error: "No books finished that year." }, { status: 404 });

  const files: Record<string, Uint8Array> = {};
  for (const [index, card] of cards.entries()) {
    const image = await renderCard(card, size, `#MyShelfie${year}`);
    const name = `${String(index + 1).padStart(2, "0")}-${card.kind}.png`;
    files[name] = new Uint8Array(await image.arrayBuffer());
  }

  // PNGs are already compressed; store them as-is.
  const zip = zipSync(files, { level: 0 });
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="shelfie-${year}-${size}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
