"use client";

import {
  Badge,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface AdminAlert {
  id: number;
  trainNumber: string;
  trainName: string;
  train: { fromStation: string; toStation: string };
  user: { fullName: string; email: string };
  travelDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  return (
    <Stack gap="xl">
      <Group gap="xs">
        <IconAlertCircle size={22} className="text-violet-700" />
        <Stack gap={0}>
          <Title order={3}>Alerts Overview</Title>
          <Text c="dimmed" size="sm">All active user alerts across the platform</Text>
        </Stack>
      </Group>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : alerts.length === 0 ? (
        <Paper p="xl" radius="lg" ta="center" withBorder>
          <IconAlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
          <Text fw={600} mb="xs">No active alerts</Text>
          <Text size="sm" c="dimmed">No users have set any alerts yet.</Text>
        </Paper>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder style={{ overflow: "hidden" }}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
                <Table.Th>User</Table.Th>
                <Table.Th>Train No.</Table.Th>
                <Table.Th>Train Name</Table.Th>
                <Table.Th>Route</Table.Th>
                <Table.Th>Travel Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alerts.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>{a.user.fullName}</Text>
                      <Text size="xs" c="dimmed">{a.user.email}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={700} size="sm" c="railwayPurple">{a.trainNumber}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1} maw={200}>{a.trainName}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{a.train.fromStation} → {a.train.toStation}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {a.travelDate
                        ? new Date(a.travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={a.isActive ? "green" : "gray"} variant="light">
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
