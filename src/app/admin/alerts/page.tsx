"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface AlertRecord {
  id: number;
  title: string;
  description: string;
  trainNumber: string | null;
  trainName: string | null;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { title: "", description: "", trainNumber: "", trainName: "" };

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [opened, { open, close }] = useDisclosure(false);

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      notifications.show({ title: "Required", message: "Title and Description are required.", color: "red" });
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        trainNumber: form.trainNumber || null,
        trainName: form.trainName || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      notifications.show({ title: "Error", message: data.error ?? "Failed to create alert", color: "red" });
    } else {
      notifications.show({ title: "Alert Broadcast", message: "Alert sent and all users notified.", color: "green" });
      setForm(emptyForm);
      close();
      fetchAlerts();
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this alert? It will be hidden from users.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/alerts?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      notifications.show({ title: "Deleted", message: "Alert removed.", color: "red" });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconAlertCircle size={22} className="text-violet-700" />
          <Stack gap={0}>
            <Title order={3}>Broadcast Alerts</Title>
            <Text c="dimmed" size="sm">Create alerts that are sent to all users as notifications</Text>
          </Stack>
        </Group>
        <Button leftSection={<IconPlus size={16} />} color="railwayPurple" radius="xl" onClick={open}>
          Create Alert
        </Button>
      </Group>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : alerts.length === 0 ? (
        <Paper p="xl" radius="lg" ta="center" withBorder>
          <Box mb="md">
            <IconAlertCircle size={48} color="var(--mantine-color-gray-4)" style={{ margin: "0 auto" }} />
          </Box>
          <Text fw={600} mb="xs">No alerts yet</Text>
          <Text size="sm" c="dimmed" mb="lg">Create your first alert to broadcast to all users instantly.</Text>
          <Button leftSection={<IconPlus size={16} />} color="railwayPurple" radius="xl" onClick={open}>
            Create Alert
          </Button>
        </Paper>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder>
          <Box style={{ overflowX: "auto" }}>
            <Table highlightOnHover miw={700}>
              <Table.Thead>
                <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Train</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Posted</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {alerts.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text size="sm" fw={600} maw={180} lineClamp={1}>{a.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" maw={280} lineClamp={2}>{a.description}</Text>
                    </Table.Td>
                    <Table.Td>
                      {a.trainNumber ? (
                        <Stack gap={0}>
                          <Text size="sm" fw={600} c="railwayPurple">{a.trainNumber}</Text>
                          {a.trainName && <Text size="xs" c="dimmed" lineClamp={1}>{a.trainName}</Text>}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" color={a.isActive ? "green" : "gray"} variant="light">
                        {a.isActive ? "Active" : "Removed"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        loading={deletingId === a.id}
                        onClick={() => handleDelete(a.id)}
                        aria-label="Delete alert"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}

      <Modal
        opened={opened}
        onClose={() => { close(); setForm(emptyForm); }}
        title={
          <Group gap="xs">
            <IconAlertCircle size={18} color="var(--mantine-color-violet-6)" />
            <Text fw={700}>Create Broadcast Alert</Text>
          </Group>
        }
        radius="lg"
        centered
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g. Mumbai Rajdhani — Platform Change"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            label="Description"
            placeholder="Describe the alert in detail — include dates, times, affected trains, and any passenger instructions."
            required
            minRows={4}
            autosize
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Group grow>
            <TextInput
              label="Train Number (optional)"
              placeholder="e.g. 12951"
              value={form.trainNumber}
              onChange={(e) => setForm((f) => ({ ...f, trainNumber: e.target.value }))}
            />
            <TextInput
              label="Train Name (optional)"
              placeholder="e.g. Mumbai Rajdhani Express"
              value={form.trainName}
              onChange={(e) => setForm((f) => ({ ...f, trainName: e.target.value }))}
            />
          </Group>
          <Text size="xs" c="dimmed">
            All active users will receive this alert as a notification immediately after posting.
          </Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={() => { close(); setForm(emptyForm); }}>
              Cancel
            </Button>
            <Button color="railwayPurple" radius="xl" loading={submitting} onClick={handleCreate}>
              Send Alert
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
