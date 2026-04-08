"use client";

import {
  Avatar,
  Badge,
  Box,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  username: string;
  state: string | null;
  city: string | null;
  role: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
}

const planColor: Record<string, string> = {
  FREE: "gray",
  MONTHLY: "blue",
  PREMIUM: "yellow",
};

const roleColor: Record<string, string> = {
  ADMIN: "railwayPurple",
  USER: "teal",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack gap="xl">
      <Group gap="xs">
        <IconUsers size={22} className="text-violet-700" />
        <Stack gap={0}>
          <Title order={3}>Users</Title>
          <Text c="dimmed" size="sm">Manage registered users and their plans</Text>
        </Stack>
      </Group>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : (
        <Paper shadow="sm" radius="lg" withBorder>
          <Box style={{ overflowX: "auto" }}>
          <Table highlightOnHover miw={900}>
            <Table.Thead>
              <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
                <Table.Th>User</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Joined</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar size="sm" radius="xl" color="railwayPurple">
                        {u.fullName.charAt(0)}
                      </Avatar>
                      <Stack gap={0}>
                        <Text size="sm" fw={600}>{u.fullName}</Text>
                        <Text size="xs" c="dimmed">{u.email}</Text>
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{[u.city, u.state].filter(Boolean).join(", ") || "â€”"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={roleColor[u.role] ?? "gray"} variant="light">{u.role}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={planColor[u.plan] ?? "gray"} variant="light">{u.plan}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={u.isActive ? "green" : "red"} variant="dot">
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {new Date(u.createdAt).toLocaleDateString("en-IN")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </Box>
        </Paper>
      )}
    </Stack>
  );
}

