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
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";

interface AlertItem {
  id: number;
  trainNumber: string;
  trainName: string;
  train: { fromStation: string; toStation: string };
  travelDate: string | null;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [travelDate, setTravelDate] = useState<Date | null>(null);
  const [trainId, setTrainId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const deleteAlert = async (id: number) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    notifications.show({ title: "Alert Deleted", message: "Alert removed.", color: "red" });
    fetchAlerts();
  };

  const createAlert = async () => {
    if (!trainId) {
      notifications.show({ title: "Validation Error", message: "Train ID is required.", color: "red" });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainId: Number(trainId), travelDate: travelDate?.toISOString() }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      notifications.show({ title: "Error", message: data.error ?? "Failed to create alert", color: "red" });
    } else {
      notifications.show({ title: "Alert Created", message: "You'll be notified about this train.", color: "green" });
      setTrainId("");
      setTravelDate(null);
      close();
      fetchAlerts();
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <Box style={{ background: "var(--railway-gradient)" }} py={48}>
        <Container size="xl">
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Group gap="xs">
                <IconAlertCircle size={24} color="white" />
                <Title order={2} c="white">My Alerts</Title>
              </Group>
              <Text c="rgba(255,255,255,0.8)">
                Track specific trains and get notified about availability
              </Text>
            </Stack>
            <Button
              leftSection={<IconPlus size={16} />}
              variant="white"
              color="railwayPurple"
              radius="xl"
              onClick={open}
            >
              New Alert
            </Button>
          </Group>
        </Container>
      </Box>

      <Container size="xl" py="xl">
        {loading ? (
          <Center py="xl"><Loader color="railwayPurple" /></Center>
        ) : alerts.length === 0 ? (
          <Paper p="xl" radius="lg" ta="center" withBorder>
            <IconAlertCircle size={48} className="text-gray-300 mx-auto mb-3" />
            <Text fw={600} mb="xs">No alerts yet</Text>
            <Text size="sm" c="dimmed" mb="md">Create your first alert to track a train.</Text>
            <Button leftSection={<IconPlus size={16} />} color="railwayPurple" radius="xl" onClick={open}>
              Create Alert
            </Button>
          </Paper>
        ) : (
          <Paper shadow="sm" radius="lg" withBorder style={{ overflow: "hidden" }}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
                  <Table.Th>Train No.</Table.Th>
                  <Table.Th>Route</Table.Th>
                  <Table.Th>Travel Date</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {alerts.map((alert) => (
                  <Table.Tr key={alert.id}>
                    <Table.Td>
                      <Text fw={700} size="sm" c="railwayPurple">{alert.trainNumber}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {alert.train.fromStation} â†’ {alert.train.toStation}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {alert.travelDate ? new Date(alert.travelDate).toLocaleDateString("en-IN") : "â€”"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(alert.createdAt).toLocaleDateString("en-IN")}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => deleteAlert(alert.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Container>

      {/* Create Alert Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <IconAlertCircle size={18} className="text-violet-600" />
            <Text fw={700}>Create New Alert</Text>
          </Group>
        }
        radius="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Train ID"
            placeholder="Enter train ID number"
            value={trainId}
            onChange={(e) => setTrainId(e.target.value)}
            required
          />
          <DatePickerInput
            label="Travel Date (optional)"
            placeholder="Pick travel date"
            value={travelDate}
            onChange={(v) => setTravelDate(v as Date | null)}
            minDate={new Date()}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={close} radius="xl">Cancel</Button>
            <Button
              onClick={createAlert}
              color="railwayPurple"
              radius="xl"
              leftSection={<IconPlus size={14} />}
              loading={submitting}
            >
              Create Alert
            </Button>
          </Group>
        </Stack>
      </Modal>
    </MainLayout>
  );
}

