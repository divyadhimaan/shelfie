"use client";

import { Button, Column, Dialog, Feedback, Row, Text } from "@once-ui-system/core";
import { useState, useTransition } from "react";
import { markFinished } from "@/app/actions/reading";
import { StarRating } from "@/components/library";

type FinishDialogProps = { open: boolean; onClose: () => void; userBookId: string; title: string };

export function FinishDialog({ open, onClose, userBookId, title }: FinishDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = () =>
    startTransition(async () => {
      setError(null);
      const result = await markFinished(userBookId, rating);
      if (result.ok) onClose();
      else setError(result.error);
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Finished it?"
      description={title}
      footer={
        <Row fillWidth horizontal="end" gap="8">
          <Button variant="tertiary" size="m" onClick={onClose}>
            Not yet
          </Button>
          <Button size="m" prefixIcon="check" loading={pending} disabled={pending} onClick={finish}>
            Mark as finished
          </Button>
        </Row>
      }
    >
      <Column gap="12" paddingY="8">
        <Text variant="body-default-m" onBackground="neutral-weak">
          How would you rate it? You can skip this and rate it later.
        </Text>
        <StarRating value={rating} onChange={setRating} label="Your rating" />
        {error && <Feedback variant="danger" description={error} />}
      </Column>
    </Dialog>
  );
}
