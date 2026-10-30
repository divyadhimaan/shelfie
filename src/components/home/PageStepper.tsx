"use client";

import { Button, Row, Text } from "@once-ui-system/core";
import { useEffect, useState, useTransition } from "react";
import { updateProgress } from "@/app/actions/reading";

type PageStepperProps = {
  userBookId: string;
  /** Current page, or null when the book's length is unknown (then it works in percent). */
  page: number | null;
  percent: number;
  totalPages: number | null;
  /** "l" for the hero card, "m" for compact rows. */
  size?: "m" | "l";
};

/** Log progress in place: − / + in steps, or type the page, then save. No dialog. */
export function PageStepper({
  userBookId,
  page,
  percent,
  totalPages,
  size = "l",
}: PageStepperProps) {
  const byPage = totalPages !== null;
  const saved = byPage ? (page ?? 0) : percent;
  const max = byPage ? totalPages : 100;
  const step = byPage ? 10 : 5;
  const unit = byPage ? "page" : "%";

  const [value, setValue] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Follow the server value after a save or a change elsewhere.
  useEffect(() => setValue(saved), [saved]);

  const clamp = (n: number) => Math.max(0, Math.min(max, Math.round(n)));
  const delta = value - saved;

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await updateProgress(
        userBookId,
        byPage ? { page: value } : { percent: value },
      );
      if (!result.ok) return setError(result.error);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    });

  const height = size === "l" ? "2.75rem" : "2.25rem";
  const label =
    delta === 0
      ? justSaved
        ? "Saved"
        : "Save"
      : byPage
        ? `Save ${delta > 0 ? "+" : "−"}${Math.abs(delta)} ${Math.abs(delta) === 1 ? unit : `${unit}s`}`
        : `Save ${value}%`;

  return (
    <Row gap="8" vertical="center" wrap>
      <Row
        role="group"
        aria-label={byPage ? "Current page" : "Percent read"}
        vertical="center"
        radius="m"
        border="neutral-alpha-medium"
        overflow="hidden"
        style={{ height }}
      >
        <Button
          variant="tertiary"
          size={size}
          corners="none"
          aria-label={byPage ? `Back ${step} pages` : `Back ${step} percent`}
          onClick={() => setValue((v) => clamp(v - step))}
          disabled={value <= 0}
        >
          −
        </Button>
        <Row as="label" vertical="center" gap="4" paddingX="8">
          {byPage && (
            <Text variant="label-default-s" onBackground="neutral-weak">
              p.
            </Text>
          )}
          <input
            type="number"
            inputMode="numeric"
            className="fineprints-number"
            min={0}
            max={max}
            value={value}
            aria-label={byPage ? "Page" : "Percent"}
            onChange={(event) => setValue(clamp(Number(event.target.value) || 0))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && delta !== 0) save();
            }}
            style={{
              width: `${String(max).length + 0.5}ch`,
              border: 0,
              outline: "none",
              background: "transparent",
              color: "var(--neutral-on-background-strong)",
              font: `600 ${size === "l" ? "1rem" : "0.9375rem"} var(--font-code)`,
              textAlign: "center",
            }}
          />
          {!byPage && (
            <Text variant="label-default-s" onBackground="neutral-weak">
              %
            </Text>
          )}
        </Row>
        <Button
          variant="tertiary"
          size={size}
          corners="none"
          aria-label={byPage ? `Forward ${step} pages` : `Forward ${step} percent`}
          onClick={() => setValue((v) => clamp(v + step))}
          disabled={value >= max}
        >
          +
        </Button>
      </Row>
      <Button
        size={size}
        variant={delta === 0 ? "secondary" : "primary"}
        loading={pending}
        disabled={pending || delta === 0}
        onClick={save}
        prefixIcon={justSaved && delta === 0 ? "check" : undefined}
      >
        {label}
      </Button>
      {error && (
        <Text role="alert" variant="body-default-s" onBackground="danger-medium">
          {error}
        </Text>
      )}
    </Row>
  );
}
