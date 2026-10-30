import { Row, SmartLink, Text } from "@once-ui-system/core";

/** Logo: an amber tile with three spines, plus the wordmark. */
export function BrandMark() {
  return (
    <SmartLink href="/" unstyled aria-label="Fineprints home">
      <Row vertical="center" gap="12">
        <Row center radius="s" solid="brand-strong" style={{ width: "2rem", height: "2rem" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
            style={{ color: "var(--brand-on-solid-strong)" }}
          >
            <path d="M5 4v16M10 4v16M15 5l4 15" />
          </svg>
        </Row>
        <Text variant="heading-strong-l" onBackground="neutral-strong">
          fineprints
        </Text>
      </Row>
    </SmartLink>
  );
}
