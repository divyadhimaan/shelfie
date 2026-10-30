"use client";

import {
  Button,
  Column,
  Feedback,
  NumberInput,
  ProgressBar,
  Row,
  Text,
} from "@once-ui-system/core";
import { useState, useTransition } from "react";
import { saveGoal } from "@/app/actions/reading";
import type { GoalPace } from "@/lib/reading/progress";

type GoalCardProps = { year: number; goal: GoalPace | null; finishedThisYear: number };

function paceText(ahead: number) {
  if (ahead === 0) return "Right on schedule";
  const books = Math.abs(ahead) === 1 ? "book" : "books";
  return ahead > 0 ? `${ahead} ${books} ahead of schedule` : `${-ahead} ${books} behind schedule`;
}

export function GoalCard({ year, goal, finishedThisYear }: GoalCardProps) {
  const [editing, setEditing] = useState(!goal);
  const [target, setTarget] = useState(goal?.target ?? 24);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      setError(null);
      const result = await saveGoal(target);
      if (result.ok) setEditing(false);
      else setError(result.error);
    });

  return (
    <Column
      fillWidth
      gap="16"
      padding="20"
      radius="l"
      border="neutral-alpha-weak"
      background="surface"
    >
      <Row horizontal="between" vertical="center">
        <Text variant="label-strong-m" onBackground="neutral-medium">
          {year} goal
        </Text>
        {goal && !editing && (
          <Button size="s" variant="tertiary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Row>

      {goal && !editing ? (
        <Column gap="12">
          <Row vertical="end" gap="8">
            <Text variant="display-strong-s" onBackground="neutral-strong">
              {goal.done}
            </Text>
            <Text variant="heading-default-m" onBackground="neutral-weak" paddingBottom="4">
              of {goal.target} books
            </Text>
          </Row>
          <ProgressBar
            value={goal.percent}
            showLabel={false}
            aria-label={`${year} goal progress`}
          />
          <Text
            variant="body-default-s"
            onBackground={goal.ahead < 0 ? "warning-medium" : "neutral-weak"}
          >
            {goal.done >= goal.target ? "Goal reached. Nice." : paceText(goal.ahead)}
          </Text>
        </Column>
      ) : (
        <Column gap="12">
          <Text variant="body-default-s" onBackground="neutral-weak">
            {finishedThisYear > 0
              ? `You've finished ${finishedThisYear} so far this year. How many are you aiming for?`
              : "How many books do you want to read this year?"}
          </Text>
          <Row gap="8" vertical="end">
            <NumberInput
              id="goal-target"
              label="Books"
              value={target}
              min={1}
              max={1000}
              onChange={(next) => setTarget(Math.round(next || 0))}
              style={{ maxWidth: "7rem" }}
            />
            <Button size="m" loading={pending} disabled={pending} onClick={save}>
              Set goal
            </Button>
            {goal && (
              <Button size="m" variant="tertiary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </Row>
          {error && <Feedback variant="danger" description={error} />}
        </Column>
      )}
    </Column>
  );
}
