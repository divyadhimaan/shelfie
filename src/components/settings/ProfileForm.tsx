"use client";

import { Button, Column, Input, Row, Text } from "@once-ui-system/core";
import { useActionState } from "react";
import { type ProfileState, updateProfile } from "@/app/actions/profile";

export function ProfileForm({ name, email }: { name: string | null; email: string | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null);

  return (
    <form action={action}>
      <Column gap="16">
        <Input
          id="name"
          name="name"
          label="Your name"
          defaultValue={name ?? ""}
          maxLength={50}
          autoComplete="given-name"
          description="Shown on your Year Shelfie cards (first name only)."
        />
        {email && (
          <Text variant="body-default-s" onBackground="neutral-weak">
            Signed in as {email}
          </Text>
        )}
        <Row gap="12" vertical="center">
          <Button type="submit" size="m" loading={pending} disabled={pending}>
            Save
          </Button>
          {state && (
            <Text
              role="status"
              variant="body-default-s"
              onBackground={state.ok ? "success-medium" : "danger-medium"}
            >
              {state.message}
            </Text>
          )}
        </Row>
      </Column>
    </form>
  );
}
