"use client";

import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { IconTrain } from "@tabler/icons-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container size="sm" py={100}>
      <Stack align="center" gap="md" ta="center">
        <IconTrain size={64} className="text-gray-300" />
        <Title order={2}>Page Not Found</Title>
        <Text c="dimmed" maw={400}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        <Button component={Link} href="/" color="railwayPurple" radius="xl" size="md">
          Back to Home
        </Button>
      </Stack>
    </Container>
  );
}
