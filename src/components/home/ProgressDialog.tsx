"use client";

import {
  Button,
  Column,
  Dialog,
  Feedback,
  NumberInput,
  Row,
  Slider,
  Text,
} from "@once-ui-system/core";
import { useState, useTransition } from "react";
import { updateProgress } from "@/app/actions/reading";

type ProgressDialogProps = {
  open: boolean;
  onClose: () => void;
  userBookId: string;
  title: string;
  page: number | null;
  percent: number;
  totalPages: number | null;
};

/** Update how far you are: by page when the length is known, otherwise by percent. */
export function ProgressDialog({
  open,
  onClose,
  userBookId,
  title,
  page,
  percent,
  totalPages,
}: ProgressDialogProps) {
  const byPage = totalPages !== null;
  const max = byPage ? totalPages : 100;
  const [value, setValue] = useState(byPage ? (page ?? 0) : percent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await updateProgress(
        userBookId,
        byPage ? { page: value } : { percent: value },
      );
      if (result.ok) onClose();
      else setError(result.error);
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Update progress"
      description={title}
      footer={
        <Row fillWidth horizontal="end" gap="8">
          <Button variant="tertiary" size="m" onClick={onClose}>
            Cancel
          </Button>
          <Button size="m" loading={pending} disabled={pending} onClick={save}>
            Save
          </Button>
        </Row>
      }
    >
      <Column gap="20" paddingY="8">
        <Row vertical="end" gap="12">
          <NumberInput
            id="progress-value"
            label={byPage ? "Page" : "Percent"}
            value={value}
            min={0}
            max={max}
            onChange={(next) => setValue(Math.max(0, Math.min(max, Math.round(next || 0))))}
            style={{ maxWidth: "8rem" }}
          />
          <Text variant="body-default-m" onBackground="neutral-weak" paddingBottom="12">
            {byPage ? `of ${totalPages} · ${Math.round((value / max) * 100)}%` : "%"}
          </Text>
        </Row>
        <Slider
          value={value}
          onChange={setValue}
          min={0}
          max={max}
          step={1}
          aria-label={byPage ? "Page" : "Percent"}
        />
        {error && <Feedback variant="danger" description={error} />}
      </Column>
    </Dialog>
  );
}
