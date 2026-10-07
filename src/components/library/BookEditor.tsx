"use client";

import {
  Button,
  Column,
  Feedback,
  Input,
  Row,
  SegmentedControl,
  Switch,
  Text,
  Textarea,
} from "@once-ui-system/core";
import { useActionState, useState } from "react";
import { type BookEditState, updateBook } from "@/app/actions/book";
import { type BookEdit, STATUS_LABELS, STATUSES, type Status } from "@/lib/library/edit";
import { StarRating } from "./StarRating";

export function BookEditor({ userBookId, initial }: { userBookId: string; initial: BookEdit }) {
  const [state, action, pending] = useActionState<BookEditState, FormData>(
    updateBook.bind(null, userBookId),
    null,
  );
  const [status, setStatus] = useState<Status>(initial.status);
  const [rating, setRating] = useState<number | null>(initial.rating);
  const [favourite, setFavourite] = useState(initial.favourite);
  const [hidden, setHidden] = useState(initial.hidden);
  // Controlled so a failed save (React resets uncontrolled form fields after an action) keeps what was typed.
  const [startedAt, setStartedAt] = useState(initial.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState(initial.finishedAt ?? "");
  const [review, setReview] = useState(initial.review ?? "");
  const errors = state?.errors ?? {};
  const showsReadFields = status !== "want_to_read";

  return (
    <form action={action}>
      {/* Controlled widgets post their values through hidden inputs. */}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="rating" value={rating ?? ""} />
      <input type="hidden" name="favourite" value={String(favourite)} />
      <input type="hidden" name="hidden" value={String(hidden)} />

      <Column gap="24">
        <Column gap="8">
          <Text variant="label-default-s" onBackground="neutral-weak">
            Status
          </Text>
          <Row fillWidth style={{ overflowX: "auto" }}>
            <SegmentedControl
              fillWidth={false}
              value={status}
              onChange={(value) => setStatus(value as Status)}
              buttons={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </Row>
        </Column>

        {showsReadFields && (
          <>
            <Column gap="8">
              <Text variant="label-default-s" onBackground="neutral-weak">
                Your rating {rating ? `· ${rating} of 5` : ""}
              </Text>
              <StarRating value={rating} onChange={setRating} label="Your rating" />
              {errors.rating && (
                <Text variant="body-default-s" onBackground="danger-medium">
                  {errors.rating}
                </Text>
              )}
            </Column>

            <Row gap="12" s={{ direction: "column" }}>
              <Input
                id="startedAt"
                name="startedAt"
                type="date"
                label="Started"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                error={!!errors.startedAt}
                errorMessage={errors.startedAt}
              />
              <Input
                id="finishedAt"
                name="finishedAt"
                type="date"
                label="Finished"
                value={finishedAt}
                onChange={(event) => setFinishedAt(event.target.value)}
                error={!!errors.finishedAt}
                errorMessage={errors.finishedAt}
                description="Decides which year this book counts toward."
              />
            </Row>

            <Textarea
              id="review"
              name="review"
              label="Your review"
              lines={5}
              value={review}
              onChange={(event) => setReview(event.target.value)}
              error={!!errors.review}
              errorMessage={errors.review}
            />
          </>
        )}

        <Column gap="12">
          <Switch
            checked={favourite}
            onToggle={() => setFavourite((f) => !f)}
            label="Favourite"
            description="Show this book among your favourites."
          />
          <Switch
            checked={hidden}
            onToggle={() => setHidden((h) => !h)}
            label="Hide from sharing"
            description="Kept in your library and stats, but never on Year Shelfie cards."
          />
        </Column>

        {state && !state.ok && <Feedback variant="danger" description={state.message} />}

        <Row gap="12" vertical="center">
          <Button type="submit" size="m" loading={pending} disabled={pending}>
            Save changes
          </Button>
          {state?.ok && (
            <Text role="status" variant="body-default-s" onBackground="success-medium">
              {state.message}
            </Text>
          )}
        </Row>
      </Column>
    </form>
  );
}
