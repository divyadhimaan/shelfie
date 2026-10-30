"use client";

import { Button } from "@once-ui-system/core";
import { useTransition } from "react";
import { beginReading } from "@/app/actions/reading";

export function StartReadingButton({ userBookId, title }: { userBookId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="s"
      variant="secondary"
      loading={pending}
      disabled={pending}
      aria-label={`Start reading ${title}`}
      onClick={() => startTransition(async () => void (await beginReading(userBookId)))}
    >
      Start
    </Button>
  );
}
