"use client";

import {
  Button,
  Card,
  Column,
  Feedback,
  Grid,
  Heading,
  ProgressBar,
  RadioButton,
  Row,
  Text,
} from "@once-ui-system/core";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  cancelImport,
  continueMatching,
  saveImport,
  uploadGoodreadsCsv,
} from "@/app/actions/import";
import type { ImportProgress, ImportView, MissingDateRule } from "@/lib/import/service";

export function ImportFlow({ view }: { view: ImportView }) {
  const [startOver, setStartOver] = useState(false);

  if (view.state === "none" || (view.state === "committed" && startOver)) return <UploadStep />;
  if (view.state === "matching")
    return <MatchingStep initial={view.progress} fileName={view.fileName} />;
  if (view.state === "review") return <ReviewStep view={view} />;
  return <DoneStep view={view} onImportAnother={() => setStartOver(true)} />;
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <Card
      direction="column"
      fillWidth
      padding="32"
      gap="24"
      radius="xl"
      border="neutral-alpha-medium"
      s={{ padding: "20" }}
    >
      {children}
    </Card>
  );
}

function UploadStep() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File) => {
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadGoodreadsCsv(formData);
      if (!result.ok) {
        setError(result.error);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      router.refresh();
    });
  };

  return (
    <StepCard>
      <Column gap="12">
        <Heading as="h2" variant="heading-strong-l">
          1. Export your Goodreads library
        </Heading>
        <Column as="ol" gap="8" paddingLeft="20" margin="0">
          <Text as="li" variant="body-default-m" onBackground="neutral-weak">
            On goodreads.com, open <strong>My Books</strong>, then{" "}
            <strong>Import and export</strong> (left sidebar, under Tools).
          </Text>
          <Text as="li" variant="body-default-m" onBackground="neutral-weak">
            Click <strong>Export Library</strong> and wait for the download link.
          </Text>
          <Text as="li" variant="body-default-m" onBackground="neutral-weak">
            Download the file. It&apos;s named like <code>goodreads_library_export.csv</code>.
          </Text>
        </Column>
      </Column>

      <Column gap="12">
        <Heading as="h2" variant="heading-strong-l">
          2. Upload it here
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          We match each book with Open Library for covers and genres. You review everything before
          it&apos;s saved.
        </Text>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="Goodreads CSV file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <Row>
          <Button
            prefixIcon="upload"
            size="l"
            loading={pending}
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Reading your file…" : "Choose CSV file"}
          </Button>
        </Row>
        {error && <Feedback variant="danger" description={error} />}
      </Column>
    </StepCard>
  );
}

function MatchingStep({ initial, fileName }: { initial: ImportProgress; fileName: string | null }) {
  const router = useRouter();
  const [progress, setProgress] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, startCancel] = useTransition();
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    (async () => {
      let current = initial;
      while (!stopped.current && current.status === "matching") {
        const result = await continueMatching(current.id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        current = result.data;
        setProgress(current);
      }
      if (!stopped.current) router.refresh();
    })();
    return () => {
      stopped.current = true;
    };
  }, [initial, router]);

  const percent = progress.total ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <StepCard>
      <Column gap="8">
        <Heading as="h2" variant="heading-strong-l">
          Matching your books
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          {fileName ? `${fileName}: ` : ""}
          {progress.processed} of {progress.total} books looked up. Keep this page open; if you
          leave, it picks up where it stopped.
        </Text>
      </Column>
      <ProgressBar value={percent} showLabel labelPosition="right" aria-label="Matching progress" />
      <Row gap="24" wrap>
        <Text variant="label-default-s" onBackground="neutral-medium">
          Matched: {progress.matched}
        </Text>
        <Text variant="label-default-s" onBackground="neutral-medium">
          Needs review: {progress.needsReview}
        </Text>
        <Text variant="label-default-s" onBackground="neutral-medium">
          Couldn&apos;t read: {progress.failed}
        </Text>
      </Row>
      {error && <Feedback variant="danger" description={error} />}
      <Row>
        <Button
          variant="tertiary"
          size="m"
          loading={cancelling}
          onClick={() => {
            stopped.current = true;
            startCancel(async () => {
              await cancelImport(progress.id);
              router.refresh();
            });
          }}
        >
          Cancel import
        </Button>
      </Row>
    </StepCard>
  );
}

function Stat({
  label,
  value,
  tone,
}: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  return (
    <Column
      padding="16"
      gap="4"
      radius="l"
      border="neutral-alpha-weak"
      background="neutral-alpha-weak"
    >
      <Text variant="display-strong-xs" onBackground={`${tone}-medium`}>
        {value}
      </Text>
      <Text variant="label-default-s" onBackground="neutral-weak">
        {label}
      </Text>
    </Column>
  );
}

function ReviewStep({ view }: { view: Extract<ImportView, { state: "review" }> }) {
  const router = useRouter();
  const [rule, setRule] = useState<MissingDateRule>("date_added");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [cancelling, startCancel] = useTransition();
  const { progress, issues, missingDateCount } = view;
  const toSave = progress.matched + progress.needsReview;

  return (
    <StepCard>
      <Column gap="8">
        <Heading as="h2" variant="heading-strong-l">
          Review your import
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-weak">
          {view.fileName ? `${view.fileName} · ` : ""}
          {progress.total} rows. Nothing is in your library until you save.
        </Text>
      </Column>

      <Grid columns="3" gap="12" s={{ columns: 1 }}>
        <Stat label="Matched with Open Library" value={progress.matched} tone="success" />
        <Stat label="Imported from Goodreads details" value={progress.needsReview} tone="warning" />
        <Stat label="Couldn't read" value={progress.failed} tone="danger" />
      </Grid>

      {missingDateCount > 0 && (
        <Column gap="12">
          <Heading as="h3" variant="heading-strong-s">
            {missingDateCount} read {missingDateCount === 1 ? "book has" : "books have"} no
            &quot;date read&quot;
          </Heading>
          <Text variant="body-default-s" onBackground="neutral-weak">
            Goodreads often leaves this blank. It decides which year a book counts toward in your
            stats and Year Shelfie.
          </Text>
          <Column gap="8" role="radiogroup" aria-label="Books without a date read">
            <RadioButton
              name="missing-date"
              value="date_added"
              checked={rule === "date_added"}
              onToggle={() => setRule("date_added")}
              label="Use the date I added the book"
              description="Good guess for most people. You can edit dates later."
            />
            <RadioButton
              name="missing-date"
              value="undated"
              checked={rule === "undated"}
              onToggle={() => setRule("undated")}
              label="Leave them undated"
              description="They stay in your library but don't count toward any year."
            />
          </Column>
        </Column>
      )}

      {issues.length > 0 && (
        <Column gap="12">
          <Heading as="h3" variant="heading-strong-s">
            Worth a look ({issues.length})
          </Heading>
          <Column gap="-1" radius="l" border="neutral-alpha-weak" overflow="hidden">
            {issues.map((issue) => (
              <Column
                key={issue.rowNumber}
                paddingX="16"
                paddingY="12"
                gap="4"
                borderBottom="neutral-alpha-weak"
              >
                <Text variant="body-strong-m">
                  {issue.title}
                  {issue.author ? (
                    <Text variant="body-default-m" onBackground="neutral-weak">
                      {" "}
                      · {issue.author}
                    </Text>
                  ) : null}
                </Text>
                <Text variant="body-default-s" onBackground="neutral-weak">
                  Row {issue.rowNumber}: {issue.message}
                </Text>
              </Column>
            ))}
          </Column>
        </Column>
      )}

      {error && <Feedback variant="danger" description={error} />}

      <Row gap="12" s={{ direction: "column" }}>
        <Button
          size="l"
          loading={saving}
          disabled={saving || cancelling || toSave === 0}
          onClick={() =>
            startSave(async () => {
              setError(null);
              const result = await saveImport(progress.id, rule);
              if (!result.ok) setError(result.error);
              else router.refresh();
            })
          }
        >
          Add {toSave} {toSave === 1 ? "book" : "books"} to my library
        </Button>
        <Button
          variant="tertiary"
          size="l"
          loading={cancelling}
          disabled={saving || cancelling}
          onClick={() =>
            startCancel(async () => {
              await cancelImport(progress.id);
              router.refresh();
            })
          }
        >
          Discard and start over
        </Button>
      </Row>
    </StepCard>
  );
}

function DoneStep({
  view,
  onImportAnother,
}: {
  view: Extract<ImportView, { state: "committed" }>;
  onImportAnother: () => void;
}) {
  return (
    <StepCard>
      <Feedback
        variant="success"
        title={`${view.added} ${view.added === 1 ? "book" : "books"} added to your library`}
        description={
          view.skipped > 0
            ? `${view.skipped} ${view.skipped === 1 ? "was" : "were"} already in your library and left unchanged.`
            : "Your Goodreads history is in Shelfie."
        }
      />
      <Row gap="12" s={{ direction: "column" }}>
        <Button href="/library" size="l" arrowIcon>
          Go to my library
        </Button>
        <Button variant="tertiary" size="l" onClick={onImportAnother}>
          Import another file
        </Button>
      </Row>
    </StepCard>
  );
}
