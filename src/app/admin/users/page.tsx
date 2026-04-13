"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch, IconTrash, IconUsers, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";

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

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState<string | null>(null);
  const [planFilter, setPlan]     = useState<string | null>(null);
  const [statusFilter, setStatus] = useState<string | null>(null);

  const [debounced] = useDebouncedValue(search, 300);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (debounced)    params.set("search", debounced);
    if (roleFilter)   params.set("role", roleFilter);
    if (planFilter)   params.set("plan", planFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, debounced, roleFilter, planFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [debounced, roleFilter, planFilter, statusFilter]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const clearFilters = () => {
    setSearch(""); setRole(null); setPlan(null); setStatus(null); setPage(1);
  };

  const hasFilters = search || roleFilter || planFilter || statusFilter;

  const deleteUser = async (user: UserRecord) => {
    const ok = window.confirm(`Delete user ${user.fullName}? This cannot be undone.`);
    if (!ok) return;
    try {
      setDeletingId(user.id);
      const res  = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { window.alert(data?.error ?? "Failed to delete user"); return; }
      fetchUsers();
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Group gap="xs">
          <IconUsers size={22} className="text-violet-700" />
          <Stack gap={0}>
            <Title order={3}>Users</Title>
            <Text c="dimmed" size="sm">Manage registered users and their plans</Text>
          </Stack>
        </Group>
        <Text size="sm" c="dimmed">{total} user{total !== 1 ? "s" : ""} total</Text>
      </Group>

      <Paper shadow="xs" radius="lg" p="md" withBorder>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search name, email, username..."
            leftSection={<IconSearch size={15} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
            radius="xl"
          />
          <Select
            placeholder="Role"
            data={[
              { value: "ADMIN", label: "Admin" },
              { value: "USER",  label: "User"  },
            ]}
            value={roleFilter}
            onChange={setRole}
            clearable
            radius="xl"
            w={130}
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            placeholder="Plan"
            data={[
              { value: "FREE",    label: "Free"    },
              { value: "MONTHLY", label: "Monthly" },
              { value: "PREMIUM", label: "Premium" },
            ]}
            value={planFilter}
            onChange={setPlan}
            clearable
            radius="xl"
            w={130}
            comboboxProps={{ withinPortal: false }}
          />
          <Select
            placeholder="Status"
            data={[
              { value: "active",   label: "Active"   },
              { value: "inactive", label: "Inactive" },
            ]}
            value={statusFilter}
            onChange={setStatus}
            clearable
            radius="xl"
            w={130}
            comboboxProps={{ withinPortal: false }}
          />
          {hasFilters && (
            <Button variant="subtle" color="gray" radius="xl" leftSection={<IconX size={14} />} onClick={clearFilters} size="sm">
              Clear
            </Button>
          )}
        </Group>
      </Paper>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : users.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconUsers size={40} className="text-gray-300" />
            <Text c="dimmed">No users found</Text>
          </Stack>
        </Center>
      ) : (
        <>
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
                    <Table.Th>Action</Table.Th>
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
                        <Text size="sm">{[u.city, u.state].filter(Boolean).join(", ") || "—"}</Text>
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
                      <Table.Td>
                        {u.role === "ADMIN" ? (
                          <Text size="xs" c="dimmed">Protected</Text>
                        ) : (
                          <ActionIcon
                            color="red"
                            variant="light"
                            aria-label={`Delete ${u.fullName}`}
                            onClick={() => deleteUser(u)}
                            loading={deletingId === u.id}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Paper>

          {totalPages > 1 && (
            <Group justify="center">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                color="railwayPurple"
                radius="xl"
                size="sm"
              />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
