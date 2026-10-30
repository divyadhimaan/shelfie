"use client";

import { Button, Column, Feedback, NumberInput, Row, Text } from "@once-ui-system/core";
import { useState, useTransition } from "react";
import { saveGoal } from "@/app/actions/reading";
import type { ActivityDay } from "@/lib/reading/activity";
import type { GoalPace } from "@/lib/reading/progress";

type GoalCardProps = {
  year: number;
  goal: GoalPace | null;
  finishedThisYear: number;
  daysLeftInYear: number;
  week: ActivityDay[];
  streak: number;
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function GoalRing({ done, target, percent }: { done: number; target: number; percent: number }) {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${done} of ${target} books, ${percent} percent`}
    >
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        stroke="var(--neutral-alpha-medium)"
        strokeWidth="8"
      />
      <circle
        cx="60"
        cy="60"
        r={RADIUS}
        fill="none"
        stroke="var(--fineprints-amber)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        fill="var(--neutral-on-background-strong)"
        fontFamily="var(--font-heading)"
        fontSize="30"
      >
        {done}
      </text>
      <text
        x="60"
        y="79"
        textAnchor="middle"
        fill="var(--neutral-on-background-weak)"
        fontFamily="var(--font-body)"
        fontSize="11"
      >
        of {target} books
      </text>
    </svg>
  );
}

function paceText(goal: GoalPace, daysLeftInYear: number) {
  const left = goal.target - goal.done;
  if (left <= 0) return "Goal reached. Everything from here is a bonus.";
  const perWeek = left / Math.max(1, daysLeftInYear / 7);
  const rate =
    perWeek >= 1
      ? `about ${Math.round(perWeek)} a week`
      : `about ${Math.round(perWeek * 4.3)} a month`;
  if (goal.ahead >= 0)
    return `${goal.ahead === 0 ? "Right on pace" : `${goal.ahead} ahead of pace`}. ${left} to go, ${rate}.`;
  return `${left} to go in ${daysLeftInYear} days, ${rate}.`;
}

/** Yearly goal as a ring, with this week's reading days and your streak underneath. */
export function GoalCard({
  year,
  goal,
  finishedThisYear,
  daysLeftInYear,
  week,
  streak,
}: GoalCardProps) {
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
      as="section"
      aria-label={`${year} goal`}
      flex={1}
      gap="20"
      padding="24"
      radius="xl"
      background="surface"
      border="neutral-alpha-weak"
      horizontal="center"
      style={{ minWidth: "min(100%, 16rem)" }}
    >
      <Row fillWidth horizontal="between" vertical="center">
        <Text
          variant="label-default-s"
          onBackground="neutral-weak"
          style={{ letterSpacing: ".1em", textTransform: "uppercase" }}
        >
          {year} goal
        </Text>
        {goal && !editing && (
          <Button size="s" variant="tertiary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Row>

      {goal && !editing ? (
        <>
          <GoalRing done={goal.done} target={goal.target} percent={goal.percent} />
          <Text
            variant="body-default-s"
            onBackground="neutral-medium"
            align="center"
            wrap="balance"
          >
            {paceText(goal, daysLeftInYear)}
          </Text>
        </>
      ) : (
        <Column fillWidth gap="12">
          <Text variant="body-default-s" onBackground="neutral-medium">
            {finishedThisYear > 0
              ? `You've finished ${finishedThisYear} so far this year. What are you aiming for?`
              : "How many books do you want to read this year?"}
          </Text>
          <Row gap="8" vertical="end" wrap>
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

      <Column gap="8" horizontal="center" style={{ marginTop: "auto" }}>
        <Row
          gap="4"
          as="ol"
          margin="0"
          padding="0"
          aria-label="Reading days this week"
          style={{ listStyle: "none" }}
        >
          {week.map((day, i) => {
            const read = day.level > 0;
            return (
              <Row
                as="li"
                key={day.date}
                center
                radius="s"
                solid={read ? "brand-strong" : undefined}
                background={read ? undefined : "neutral-alpha-weak"}
                border={day.future ? "neutral-alpha-medium" : undefined}
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  ...(day.future ? { borderStyle: "dashed", background: "transparent" } : {}),
                }}
                aria-label={`${day.date}: ${read ? `read${day.pages ? `, ${day.pages} pages` : ""}` : day.future ? "upcoming" : "no reading"}`}
              >
                <Text
                  variant="label-default-xs"
                  onSolid={read ? "brand-strong" : undefined}
                  onBackground={read ? undefined : "neutral-weak"}
                >
                  {WEEKDAYS[i]}
                </Text>
              </Row>
            );
          })}
        </Row>
        <Text variant="label-default-s" onBackground="neutral-weak">
          {streak > 0 ? `${streak}-day streak` : "Read today to start a streak"}
        </Text>
      </Column>
    </Column>
  );
}
