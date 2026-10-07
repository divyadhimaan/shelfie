import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { CARD_SIZES, type CardSize, type WrapCard } from "./build";

/* Satori renders plain JSX with inline styles (flexbox only) and needs literal colors, not CSS variables. */
const C = {
  background: "#171611", // sand-200
  ink: "#f7f5ed", // sand-1100
  muted: "#a7a59c",
  line: "#302e27",
  accent: "#e79d7b", // terracotta, lightened for large text on the dark card
  bar: "#b7684c", // --shelfie-chart
};

const FONT_FILES = [
  {
    name: "Fraunces",
    weight: 600,
    file: "@fontsource/fraunces/files/fraunces-latin-600-normal.woff",
  },
  { name: "Geist", weight: 400, file: "@fontsource/geist/files/geist-latin-400-normal.woff" },
  { name: "Geist", weight: 600, file: "@fontsource/geist/files/geist-latin-600-normal.woff" },
] as const;

let fontsPromise: Promise<
  { name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[]
> | null = null;

function loadFonts() {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async (font) => {
      const buffer = await readFile(join(process.cwd(), "node_modules", font.file));
      return {
        name: font.name,
        data: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
        weight: font.weight,
        style: "normal" as const,
      };
    }),
  );
  return fontsPromise;
}

const coverCache = new Map<string, string>();
const failedAt = new Map<string, number>();
const RETRY_FAILED_AFTER_MS = 60_000;

async function fetchCover(url: string, attempt = 0): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) throw new Error(`cover ${response.status}`);
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
  } catch (error) {
    if (attempt === 0) return fetchCover(url, 1);
    throw error;
  }
}

/** Fetches a cover as a data URI (one retry). Null when it fails; failures are retried after a minute. */
async function loadCover(url: string | null): Promise<string | null> {
  if (!url) return null;
  const cached = coverCache.get(url);
  if (cached) return cached;
  if (Date.now() - (failedAt.get(url) ?? 0) < RETRY_FAILED_AFTER_MS) return null;
  try {
    const data = await fetchCover(url);
    coverCache.set(url, data);
    failedAt.delete(url);
    return data;
  } catch {
    failedAt.set(url, Date.now());
    return null;
  }
}

/** Loads covers four at a time so a collage doesn't flood the cover server. */
async function loadCovers(urls: (string | null)[]) {
  const results: (string | null)[] = [];
  for (let i = 0; i < urls.length; i += 4) {
    results.push(...(await Promise.all(urls.slice(i, i + 4).map(loadCover))));
  }
  return results;
}

type Layout = { width: number; height: number; compact: boolean };

/** Satori lays out fragments as rows; every card body is an explicit column. */
function Stack({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{children}</div>;
}

function Cover({ src, width, title }: { src: string | null; width: number; title: string }) {
  const height = Math.round(width * 1.5);
  if (!src) {
    return (
      <div
        style={{
          width,
          height,
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-end",
          padding: 24,
          background: C.bar,
          borderRadius: 12,
          color: C.ink,
          fontFamily: "Fraunces",
          fontSize: width / 7,
          lineHeight: 1.1,
        }}
      >
        {title}
      </div>
    );
  }
  // biome-ignore lint/a11y/useAltText: Satori renders to a PNG; alt text has no effect.
  return (
    <img
      src={src}
      width={width}
      height={height}
      style={{ borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
    />
  );
}

function Eyebrow({ children, size }: { children: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        color: C.accent,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Big({ children, size }: { children: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Fraunces",
        fontSize: size,
        lineHeight: 1.02,
        color: C.ink,
        letterSpacing: -2,
      }}
    >
      {children}
    </div>
  );
}

function Sub({ children, size }: { children: string; size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, color: C.muted, lineHeight: 1.3 }}>
      {children}
    </div>
  );
}

/** Long titles step down so they stay within the card. */
const titleSize = (title: string, base: number) =>
  Math.round(base * (title.length > 32 ? 0.6 : title.length > 18 ? 0.78 : 1));

const plural = (n: number, word: string) =>
  `${n.toLocaleString("en")} ${n === 1 ? word : `${word}s`}`;

const STAR_PATH = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z";

/** Drawn as SVG: the card fonts don't include star glyphs. A half star is a full star clipped to half width. */
function Stars({ rating, size }: { rating: number; size: number }) {
  const whole = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const star = (key: string) => (
    <svg key={key} width={size} height={size} viewBox="0 0 24 24">
      <path d={STAR_PATH} fill={C.accent} />
    </svg>
  );
  return (
    <div style={{ display: "flex", gap: size / 6 }}>
      {Array.from({ length: whole }, (_, i) => star(`s${i}`))}
      {half && (
        <div style={{ display: "flex", width: size / 2, overflow: "hidden" }}>{star("half")}</div>
      )}
    </div>
  );
}

function Body({
  card,
  layout,
  covers,
}: { card: WrapCard; layout: Layout; covers: (string | null)[] }) {
  // Type scales with the card's height: story (1920) > portrait (1350) > square (1080).
  const t =
    layout.height >= 1900
      ? { big: 230, eyebrow: 50, sub: 62 }
      : layout.height >= 1300
        ? { big: 190, eyebrow: 44, sub: 52 }
        : { big: 150, eyebrow: 38, sub: 44 };
  const big = t.big;
  const coverWidth = layout.height >= 1900 ? 420 : layout.height >= 1300 ? 300 : 240;

  switch (card.kind) {
    case "intro":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>Year Shelfie</Eyebrow>
          <Big size={big * 0.74}>{`Your ${card.year}`}</Big>
          <Big size={big * 0.74}>in books</Big>
          {card.name ? (
            <Sub size={t.sub}>{`${card.name}'s reading year, wrapped.`}</Sub>
          ) : (
            <Sub size={t.sub}>Your reading year, wrapped.</Sub>
          )}
        </Stack>
      );
    case "books":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>{`In ${card.year} you finished`}</Eyebrow>
          <Big size={big * 1.2}>{plural(card.books, "book")}</Big>
          {card.pages > 0 && (
            <Sub
              size={t.sub}
            >{`${card.pages.toLocaleString("en")} pages, about ${Math.round(card.pages / 52)} a week`}</Sub>
          )}
        </Stack>
      );
    case "genre":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>Your top genre</Eyebrow>
          <Big size={big}>{card.genre}</Big>
          <Sub size={t.sub}>{`${plural(card.books, "book")}, ${card.share}% of your year`}</Sub>
          {card.runnersUp.length > 0 && (
            <Sub size={t.sub}>{`Then ${card.runnersUp.join(" and ")}`}</Sub>
          )}
        </Stack>
      );
    case "author":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>Most-read author</Eyebrow>
          <Big size={titleSize(card.author, big * 0.8)}>{card.author}</Big>
          <Sub size={t.sub}>{`${plural(card.books, "book")} this year`}</Sub>
        </Stack>
      );
    case "authors":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>You read</Eyebrow>
          <Big size={big}>{`${card.distinct} authors`}</Big>
          <Sub size={t.sub}>Never the same one twice.</Sub>
        </Stack>
      );
    case "favourite":
    case "longest":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: layout.compact ? "row" : "column",
            gap: 56,
            alignItems: layout.compact ? "center" : "flex-start",
          }}
        >
          <Cover src={covers[0] ?? null} width={coverWidth} title={card.book.title} />
          {/* flex: 1 only beside the cover; in a column it would collapse to zero height in Satori. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              ...(layout.compact ? { flex: 1 } : {}),
            }}
          >
            <Eyebrow size={t.eyebrow}>
              {card.kind === "favourite" ? "Your favourite" : "Your longest read"}
            </Eyebrow>
            <Big
              size={titleSize(
                card.book.title,
                layout.compact ? 84 : layout.height >= 1900 ? 130 : 110,
              )}
            >
              {card.book.title}
            </Big>
            {card.book.author && <Sub size={t.sub}>{card.book.author}</Sub>}
            {card.kind === "favourite" ? (
              <Stars rating={card.rating} size={64} />
            ) : (
              <div
                style={{ display: "flex", fontSize: 56, color: C.accent }}
              >{`${card.pages.toLocaleString("en")} pages`}</div>
            )}
          </div>
        </div>
      );
    case "month":
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>Your busiest month</Eyebrow>
          <Big size={big}>{card.month}</Big>
          <Sub size={t.sub}>{`${plural(card.books, "book")} finished`}</Sub>
        </Stack>
      );
    case "collage": {
      const columns = layout.height >= 1900 ? 3 : 4;
      const rows = layout.height >= 1900 ? 4 : layout.height >= 1300 ? 3 : 2;
      const gap = 20;
      const width = Math.floor((layout.width - 2 * 88 - gap * (columns - 1)) / columns);
      const shown = covers.filter(Boolean).slice(0, columns * rows) as string[];
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>{`${plural(card.books, "book")} in ${card.year}`}</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap, marginTop: 16 }}>
            {shown.map((src, i) => (
              // biome-ignore lint/a11y/useAltText: rendered to PNG
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              <img
                key={i}
                src={src}
                width={width}
                height={Math.round(width * 1.5)}
                style={{ borderRadius: 10, objectFit: "cover" }}
              />
            ))}
          </div>
        </Stack>
      );
    }
    case "summary": {
      const rows: [string, string][] = [
        ["Books", card.books.toLocaleString("en")],
        ...(card.pages > 0
          ? ([["Pages", card.pages.toLocaleString("en")]] as [string, string][])
          : []),
        ...(card.averageRating !== null
          ? ([["Average rating", `${card.averageRating.toFixed(1)} of 5`]] as [string, string][])
          : []),
        ...(card.topGenre ? ([["Top genre", card.topGenre]] as [string, string][]) : []),
        ...(card.topAuthor ? ([["Top author", card.topAuthor]] as [string, string][]) : []),
        ...(card.favourite ? ([["Favourite", card.favourite]] as [string, string][]) : []),
      ];
      return (
        <Stack>
          <Eyebrow size={t.eyebrow}>{`My ${card.year} Year Shelfie`}</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
            {rows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 40,
                  padding: layout.compact ? "18px 0" : "28px 0",
                  borderBottom: `2px solid ${C.line}`,
                  fontSize: layout.compact ? 42 : layout.height >= 1900 ? 58 : 50,
                }}
              >
                <div style={{ display: "flex", color: C.muted }}>{label}</div>
                <div
                  style={{
                    display: "flex",
                    color: C.ink,
                    fontWeight: 600,
                    textAlign: "right",
                    maxWidth: "65%",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Stack>
      );
    }
  }
}

function coverUrlsFor(card: WrapCard): (string | null)[] {
  if (card.kind === "favourite" || card.kind === "longest") return [card.book.coverUrl];
  if (card.kind === "collage") return card.covers;
  return [];
}

/** Renders one wrap card to a PNG response (SHR-1, SHR-2). */
export async function renderCard(card: WrapCard, size: CardSize, footer: string) {
  const { width, height } = CARD_SIZES[size];
  const layout: Layout = { width, height, compact: height < 1300 };
  const [fonts, covers] = await Promise.all([loadFonts(), loadCovers(coverUrlsFor(card))]);

  return new ImageResponse(
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: layout.compact ? "72px 88px" : "120px 88px",
        background: C.background,
        color: C.ink,
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 52, color: C.ink }}>
          Shelfie
        </div>
        <div
          style={{ display: "flex", width: 120, height: 8, borderRadius: 4, background: C.bar }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <Body card={card} layout={layout} covers={covers} />
      </div>
      <div style={{ display: "flex", fontSize: 36, color: C.muted }}>{footer}</div>
    </div>,
    { width, height, fonts },
  );
}
