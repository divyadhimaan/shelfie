"use client";

import { Button, Column, Row, SegmentedControl, Text } from "@once-ui-system/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_SIZES, type CardKind, type CardSize } from "@/lib/wrap/build";
import styles from "./WrapViewer.module.scss";

const CARD_TITLES: Record<CardKind, string> = {
  intro: "Intro",
  books: "Books and pages",
  genre: "Top genre",
  author: "Most-read author",
  authors: "Authors",
  favourite: "Favourite book",
  month: "Busiest month",
  longest: "Longest read",
  collage: "Cover collage",
  summary: "Summary",
};

type WrapViewerProps = {
  year: number;
  cards: CardKind[];
  /** Changes whenever the wrap's data does, so cached card images are never stale. */
  version: string;
};

const cardUrl = (year: number, kind: CardKind, size: CardSize, version: string, download = false) =>
  `/api/wrap/${year}/${kind}?size=${size}&v=${version}${download ? "&download=1" : ""}`;

/** Story-style viewer for the Year Shelfie cards (WRP-1) with download and share (SHR-2, SHR-3). */
export function WrapViewer({ year, cards, version }: WrapViewerProps) {
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState<CardSize>("story");
  const [loaded, setLoaded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const kind = cards[index];
  const { width, height } = CARD_SIZES[size];

  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(cards.length - 1, Math.max(0, i + delta))),
    [cards.length],
  );

  // A cached image can finish loading before hydration attaches onLoad, so check `complete` too.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-check whenever the shown card changes
  useEffect(() => setLoaded(Boolean(imageRef.current?.complete)), [kind, size]);

  // Warm the next card so tapping forward feels instant.
  useEffect(() => {
    const next = cards[index + 1];
    if (next) new Image().src = cardUrl(year, next, size, version);
  }, [cards, index, size, year, version]);

  useEffect(() => {
    const probe = new File([""], "probe.png", { type: "image/png" });
    setCanShareFiles(
      typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [probe] }),
    );
  }, []);

  const share = async () => {
    setSharing(true);
    try {
      const blob = await (await fetch(cardUrl(year, kind, size, version))).blob();
      const file = new File([blob], `shelfie-${year}-${kind}.png`, { type: "image/png" });
      await navigator.share({ files: [file], text: `My ${year} Year Shelfie #MyShelfie${year}` });
    } catch {
      // Cancelled or unsupported: nothing to do.
    } finally {
      setSharing(false);
    }
  };

  return (
    <Column fillWidth gap="20" horizontal="center">
      <Column maxWidth={size === "story" ? 24 : size === "portrait" ? 30 : 34} gap="16">
        <div
          className={styles.stage}
          style={{ aspectRatio: `${width} / ${height}` }}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`Year Shelfie ${year}, card ${index + 1} of ${cards.length}: ${CARD_TITLES[kind]}. Use the arrow keys to move.`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(1);
            if (event.key === "ArrowLeft") go(-1);
          }}
          onPointerDown={(event) => {
            pointerStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            const start = pointerStart.current;
            pointerStart.current = null;
            if (start !== null && Math.abs(event.clientX - start) > 40)
              go(event.clientX < start ? 1 : -1);
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: the card is a server-rendered PNG, not an optimisable asset */}
          <img
            key={`${kind}-${size}`}
            ref={imageRef}
            src={cardUrl(year, kind, size, version)}
            alt={`${CARD_TITLES[kind]} card`}
            className={styles.image}
            style={{ opacity: loaded ? 1 : 0.4, transition: "opacity 200ms" }}
            onLoad={() => setLoaded(true)}
            draggable={false}
          />
          <div className={styles.segments}>
            {cards.map((c, i) => (
              <button
                key={c}
                type="button"
                className={styles.segment}
                data-done={i <= index}
                aria-label={`Go to ${CARD_TITLES[c]}`}
                aria-current={i === index ? "step" : undefined}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className={styles.zonePrev}
            aria-label="Previous card"
            onClick={() => go(-1)}
          />
          <button
            type="button"
            className={styles.zoneNext}
            aria-label="Next card"
            onClick={() => go(1)}
          />
        </div>

        <Row horizontal="between" vertical="center" gap="12">
          <Text variant="label-default-s" onBackground="neutral-weak">
            {index + 1} / {cards.length} · {CARD_TITLES[kind]}
          </Text>
          <Row gap="4">
            <Button
              variant="tertiary"
              size="s"
              prefixIcon="chevronLeft"
              disabled={index === 0}
              onClick={() => go(-1)}
            >
              Back
            </Button>
            <Button
              variant="tertiary"
              size="s"
              suffixIcon="chevronRight"
              disabled={index === cards.length - 1}
              onClick={() => go(1)}
            >
              Next
            </Button>
          </Row>
        </Row>
      </Column>

      <Column
        maxWidth={34}
        gap="12"
        padding="16"
        radius="l"
        border="neutral-alpha-weak"
        background="surface"
      >
        <Text variant="label-default-s" onBackground="neutral-weak">
          Size for Instagram
        </Text>
        <SegmentedControl
          value={size}
          onChange={(value) => setSize(value as CardSize)}
          buttons={(Object.keys(CARD_SIZES) as CardSize[]).map((key) => ({
            value: key,
            label: CARD_SIZES[key].label,
          }))}
        />
        <Row gap="8" wrap>
          {canShareFiles && (
            <Button size="m" prefixIcon="forward" loading={sharing} onClick={share}>
              Share
            </Button>
          )}
          <Button
            size="m"
            variant={canShareFiles ? "secondary" : "primary"}
            prefixIcon="download"
            href={cardUrl(year, kind, size, version, true)}
          >
            Download card
          </Button>
          <Button
            size="m"
            variant="secondary"
            prefixIcon="download"
            href={`/api/wrap/${year}/zip?size=${size}`}
          >
            Download all ({cards.length})
          </Button>
        </Row>
      </Column>
    </Column>
  );
}
