"use client";

import { Button, Row } from "@once-ui-system/core";
import { useState } from "react";
import { FinishDialog, PageStepper, StartReadingButton } from "@/components/home";
import type { Progress } from "@/lib/reading/progress";

type ReadingActionsProps = {
  userBookId: string;
  title: string;
  status: "want_to_read" | "reading" | "read" | "dnf" | "paused";
  progress: Progress | null;
};

/** What you can do from the book's header: log pages, finish, or start. */
export function ReadingActions({ userBookId, title, status, progress }: ReadingActionsProps) {
  const [finishing, setFinishing] = useState(false);

  if (status !== "reading") {
    return status === "read" ? null : (
      <Row>
        <StartReadingButton userBookId={userBookId} title={title} />
      </Row>
    );
  }

  return (
    <Row gap="8" wrap vertical="center">
      <PageStepper
        userBookId={userBookId}
        page={progress?.page ?? null}
        percent={progress?.percent ?? 0}
        totalPages={progress?.totalPages ?? null}
      />
      <Button size="l" variant="tertiary" prefixIcon="check" onClick={() => setFinishing(true)}>
        Finished
      </Button>
      {finishing && (
        <FinishDialog
          open
          onClose={() => setFinishing(false)}
          userBookId={userBookId}
          title={title}
        />
      )}
    </Row>
  );
}
