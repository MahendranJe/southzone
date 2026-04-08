"use client";

import {
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCreditCard, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

interface Payment {
  id: number;
  user: { fullName: string; email: string };
  plan: string;
  amount: number;
  utrNumber: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: string;
}

const statusColor: Record<string, string> = {
  PENDING: "orange",
  COMPLETED: "green",
  REJECTED: "red",
};

const planColor: Record<string, string> = {
  MONTHLY: "blue",
  PREMIUM: "yellow",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => setPayments(d.payments ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const approve = async (id: number) => {
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (res.ok) {
      notifications.show({ title: "Payment Approved", message: "Subscription activated for user.", color: "green" });
      fetchPayments();
    }
  };

  const reject = async (id: number) => {
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    if (res.ok) {
      notifications.show({ title: "Payment Rejected", message: "Payment marked as rejected.", color: "red" });
      fetchPayments();
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Group gap="xs">
          <IconCreditCard size={22} className="text-violet-700" />
          <Stack gap={0}>
            <Title order={3}>Payments</Title>
            <Text c="dimmed" size="sm">Manage UPI payment verifications</Text>
          </Stack>
        </Group>
        <Paper px="lg" py="sm" radius="lg" withBorder>
          <Text size="sm" c="dimmed">Total Revenue</Text>
          <Text fw={800} size="xl" c="green">â‚¹{totalRevenue.toLocaleString()}</Text>
        </Paper>
      </Group>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder style={{ overflow: "hidden" }}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
                <Table.Th>User</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>UTR Number</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payments.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text size="sm" fw={600}>{p.user.fullName}</Text>
                    <Text size="xs" c="dimmed">{p.user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={planColor[p.plan] ?? "gray"} variant="light" size="sm">
                      {p.plan}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text size="sm" fw={700}>â‚¹{p.amount}</Text></Table.Td>
                  <Table.Td><Text size="xs" ff="monospace">{p.utrNumber}</Text></Table.Td>
                  <Table.Td>
                    <Badge color={statusColor[p.status]} variant="light" size="sm">{p.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {p.status === "PENDING" && (
                      <Group gap="xs">
                        <Button
                          size="xs"
                          color="green"
                          variant="light"
                          radius="xl"
                          leftSection={<IconCheck size={12} />}
                          onClick={() => approve(p.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          radius="xl"
                          leftSection={<IconX size={12} />}
                          onClick={() => reject(p.id)}
                        >
                          Reject
                        </Button>
                      </Group>
                    )}
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

