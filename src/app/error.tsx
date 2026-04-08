"use client";

import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container size="sm" py={100}>
      <Stack align="center" gap="md" ta="center">
        <IconAlertTriangle size={64} className="text-orange-400" />
        <Title order={2}>Something went wrong</Title>
        <Text c="dimmed" maw={400}>
          An unexpected error occurred. Please try again.
        </Text>
        <Button color="railwayPurple" radius="xl" size="md" onClick={reset}>
          Try Again
        </Button>
      </Stack>
    </Container>
  );
}
