"use client";

import {
  Badge,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowRight,
  IconTrain,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/StatCard";

interface Stats {
  totalUsers: number;
  totalTrains: number;
  activeAlerts: number;
  pendingPayments: number;
}

interface RecentTrain {
  id: number;
  trainNumber: string;
  title: string;
  scheduleType: string;
  scheduleBadgeText: string | null;
  updatedAt: string;
}

const scheduleColors: Record<string, string> = {
  Daily: "green",
  Weekly: "blue",
  CustomDays: "violet",
  OneTime: "orange",
  DateRange: "cyan",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrains, setRecentTrains] = useState<RecentTrain[]>([]);
  const [trainsLoading, setTrainsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));

    fetch("/api/trains?pageSize=5")
      .then((r) => r.json())
      .then((d) => setRecentTrains(d.trains ?? []))
      .finally(() => setTrainsLoading(false));
  }, []);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={2}>
          <Title order={3}>Dashboard</Title>
          <Text c="dimmed" size="sm">Southzone Railway — Admin Overview</Text>
        </Stack>
        <Text size="xs" c="dimmed">Last updated: {new Date().toLocaleString()}</Text>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, md: 3 }} spacing="md">
        {stats ? (
          <>
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} icon={IconUsers} color="railwayPurple" />
            <StatCard label="Train Updates" value={stats.totalTrains.toLocaleString()} icon={IconTrain} color="blue" />
            <StatCard label="Active Alerts" value={stats.activeAlerts.toLocaleString()} icon={IconAlertCircle} color="orange" />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={90} radius="lg" />
          ))
        )}
      </SimpleGrid>

      {/* Pending actions banners */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Paper
            p="md"
            radius="lg"
            style={{ background: "rgba(102,126,234,0.08)", border: "1.5px solid rgba(102,126,234,0.2)" }}
          >
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon color="railwayPurple" variant="light" size="md" radius="md">
                  <IconAlertCircle size={16} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text fw={700} size="sm">{stats?.activeAlerts ?? 0} Active Alerts</Text>
                  <Text size="xs" c="dimmed">User train tracking alerts</Text>
                </Stack>
              </Group>
              <Button
                component={Link}
                href="/admin/alerts"
                size="xs"
                color="railwayPurple"
                variant="light"
                radius="xl"
                rightSection={<IconArrowRight size={12} />}
              >
                View
              </Button>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Recent train updates */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper shadow="sm" radius="lg" withBorder style={{ overflow: "hidden" }}>
            <Group
              justify="space-between"
              px="lg"
              py="md"
              style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}
            >
              <Group gap="xs">
                <IconTrain size={16} className="text-violet-600" />
                <Text fw={600} size="sm">Recent Train Updates</Text>
              </Group>
              <Button
                component={Link}
                href="/admin/trains"
                size="xs"
                variant="subtle"
                color="railwayPurple"
              >
                View All
              </Button>
            </Group>
            {trainsLoading ? (
              <Center py="lg"><Loader size="sm" color="railwayPurple" /></Center>
            ) : (
              <Table>
                <Table.Tbody>
                  {recentTrains.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td>
                        <Text fw={700} size="sm" c="railwayPurple">{t.trainNumber}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={1}>{t.title}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="xs" color={scheduleColors[t.scheduleType] ?? "gray"} variant="light">
                          {t.scheduleBadgeText ?? t.scheduleType}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
