"use client";

import {
  Badge,
  Box,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconBell, IconTrain } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";

interface AlertItem {
  id: number;
  title: string;
  description: string;
  trainNumber: string | null;
  trainName: string | null;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <Box style={{ background: "var(--railway-gradient)" }} py={48}>
        <Container size="xl">
          <Group gap="sm">
            <IconBell size={24} color="white" />
            <Stack gap={2}>
              <Title order={2} c="white">Railway Alerts</Title>
              <Text c="rgba(255,255,255,0.8)" size="sm">
                Official alerts from Southzone Railway — special trains, bookings, schedule changes
              </Text>
            </Stack>
          </Group>
        </Container>
      </Box>

      <Container size="xl" py="xl">
        {loading ? (
          <Center py="xl"><Loader color="railwayPurple" /></Center>
        ) : alerts.length === 0 ? (
          <Paper p="xl" radius="lg" ta="center" withBorder>
            <Box mb="md">
              <IconAlertCircle size={48} color="var(--mantine-color-gray-4)" style={{ margin: "0 auto" }} />
            </Box>
            <Text fw={600} mb="xs">No alerts right now</Text>
            <Text size="sm" c="dimmed">Check back later for official railway alerts and announcements.</Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {alerts.map((alert) => (
              <Paper
                key={alert.id}
                shadow="sm"
                radius="lg"
                p="xl"
                withBorder
                style={{ borderLeft: "4px solid var(--mantine-color-violet-6)" }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap="sm" align="flex-start" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <IconAlertCircle
                      size={20}
                      color="var(--mantine-color-violet-6)"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={700} size="md">{alert.title}</Text>
                      <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                        {alert.description}
                      </Text>
                      {alert.trainNumber && (
                        <Group gap="xs" mt={4}>
                          <IconTrain size={14} color="var(--mantine-color-violet-6)" />
                          <Text size="xs" c="railwayPurple" fw={600}>
                            Train {alert.trainNumber}
                            {alert.trainName ? ` — ${alert.trainName}` : ""}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Group>
                  <Badge size="xs" color="violet" variant="light" style={{ flexShrink: 0, marginLeft: 12 }}>
                    {new Date(alert.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </MainLayout>
  );
}
