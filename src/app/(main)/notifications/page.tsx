"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications as mantineNotifications } from "@mantine/notifications";
import {
  IconBell,
  IconBellOff,
  IconCheck,
  IconChecks,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";

interface NotifItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ALERT";
}

const typeColor: Record<string, string> = {
  INFO: "blue",
  SUCCESS: "green",
  WARNING: "orange",
  ALERT: "red",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(() => {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    mantineNotifications.show({ title: "All marked as read", message: "", color: "green" });
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <MainLayout>
      {/* Header */}
      <Box style={{ background: "var(--railway-gradient)" }} py={48}>
        <Container size="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Group gap="xs">
                <IconBell size={24} color="white" />
                <Title order={2} c="white">Notifications</Title>
                {unreadCount > 0 && (
                  <Badge color="red" variant="filled" size="sm">{unreadCount} new</Badge>
                )}
              </Group>
              <Text c="rgba(255,255,255,0.8)">
                Stay updated with your train alerts and account activity
              </Text>
            </Stack>
            {unreadCount > 0 && (
              <Button
                variant="white"
                color="railwayPurple"
                radius="xl"
                size="sm"
                leftSection={<IconChecks size={16} />}
                onClick={markAllRead}
              >
                Mark All Read
              </Button>
            )}
          </Group>
        </Container>
      </Box>

      <Container size="xl" py="xl" maw={720}>
        {loading ? (
          <Center py="xl"><Loader color="railwayPurple" /></Center>
        ) : notifs.length === 0 ? (
          <Paper p="xl" radius="lg" ta="center" withBorder>
            <IconBellOff size={48} className="text-gray-300 mx-auto mb-3" />
            <Text fw={600}>No notifications</Text>
            <Text size="sm" c="dimmed">You're all caught up!</Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {notifs.map((n) => (
              <Paper
                key={n.id}
                shadow="xs"
                radius="lg"
                p="lg"
                withBorder
                style={{
                  borderLeft: `4px solid var(--mantine-color-${typeColor[n.type] ?? "blue"}-5)`,
                  background: n.isRead ? undefined : "rgba(102,126,234,0.04)",
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Group gap="md" align="flex-start" wrap="nowrap" className="flex-1 min-w-0">
                    <ThemeIcon
                      size="md"
                      radius="xl"
                      color={typeColor[n.type] ?? "blue"}
                      variant="light"
                      style={{ flexShrink: 0 }}
                    >
                      <IconBell size={14} />
                    </ThemeIcon>
                    <Stack gap={2} className="min-w-0">
                      <Group gap="xs" align="center">
                        <Text fw={n.isRead ? 500 : 700} size="sm">{n.title}</Text>
                        {!n.isRead && (
                          <Badge size="xs" color="railwayPurple" variant="filled">New</Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed" lineClamp={2}>{n.message}</Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {new Date(n.createdAt).toLocaleString("en-IN")}
                      </Text>
                    </Stack>
                  </Group>
                  {!n.isRead && (
                    <ActionIcon
                      variant="subtle"
                      color="green"
                      size="sm"
                      style={{ flexShrink: 0 }}
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                    >
                      <IconCheck size={14} />
                    </ActionIcon>
                  )}
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </MainLayout>
  );
}

