import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isCardSize } from "@/lib/wrap/build";
import { displayName, getWrap } from "@/lib/wrap/data";
import { renderCard } from "@/lib/wrap/render";

export const runtime = "nodejs";

/** GET /api/wrap/2026/books?size=story[&download=1] → one card as PNG. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ year: string; card: string }> },
) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to see your wrap." }, { status: 401 });

  const { year: yearParam, card: kind } = await params;
  const year = Number(yearParam);
  const url = new URL(request.url);
  const size = url.searchParams.get("size");
  if (!Number.isInteger(year) || !isCardSize(size)) {
    return NextResponse.json({ error: "Unknown year or size." }, { status: 400 });
  }

  const { cards } = await getWrap(userId, year, displayName(session.user ?? {}));
  const card = cards.find((c) => c.kind === kind);
  if (!card) return NextResponse.json({ error: "No such card for this year." }, { status: 404 });

  const image = await renderCard(card, size, `#MyShelfie${year}`);
  const headers = new Headers(image.headers);
  // Personal data: browser cache only. Versioned URLs (?v=) change with the data, so a day is safe.
  headers.set(
    "Cache-Control",
    url.searchParams.has("v") ? "private, max-age=86400" : "private, no-cache",
  );
  if (url.searchParams.get("download")) {
    headers.set(
      "Content-Disposition",
      `attachment; filename="shelfie-${year}-${kind}-${size}.png"`,
    );
  }
  return new Response(image.body, { status: image.status, headers });
}
