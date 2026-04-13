"use client";

import {
  AppShell,
  Box,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAlertCircle,
  IconDashboard,
  IconTrain,
  IconUsers,
  IconLogout,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: IconDashboard },
  { href: "/admin/trains", label: "Train Updates", icon: IconTrain },
  { href: "/admin/users", label: "Users", icon: IconUsers },
  { href: "/admin/alerts", label: "Alerts", icon: IconAlertCircle },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      {/* Header */}
      <AppShell.Header style={{ background: "var(--railway-gradient)" }}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" color="white" size="sm" />
            <ThemeIcon
              size="md"
              radius="md"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <IconTrain size={16} color="white" />
            </ThemeIcon>
            <Stack gap={0}>
              <Text fw={700} size="sm" c="white" lh={1.2}>Southzone Admin</Text>
              <Text size="xs" c="rgba(255,255,255,0.7)" lh={1.2}>Management Panel</Text>
            </Stack>
          </Group>
          <Group gap="xs" visibleFrom="sm">
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="white"
              size="xs"
              radius="xl"
            >
              View Site
            </Button>
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="white"
              size="xs"
              radius="xl"
              leftSection={<IconLogout size={14} />}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar */}
      <AppShell.Navbar p="md" style={{ background: "var(--mantine-color-body)" }}>
        <ScrollArea h="100%">
          <Stack gap={4} style={{ minHeight: "100%" }}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" mb="xs">
              Navigation
            </Text>
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <NavLink
                  key={item.href}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={
                    <ThemeIcon
                      size="sm"
                      radius="md"
                      color="railwayPurple"
                      variant={isActive ? "filled" : "light"}
                    >
                      <item.icon size={14} />
                    </ThemeIcon>
                  }
                  active={isActive}
                  color="railwayPurple"
                />
              );
            })}

            <Box hiddenFrom="sm" mt="md">
              <Stack gap="xs">
                <Button
                  component={Link}
                  href="/"
                  variant="light"
                  color="railwayPurple"
                  radius="md"
                  fullWidth
                >
                  View Site
                </Button>
                <Button
                  component={Link}
                  href="/"
                  variant="light"
                  color="red"
                  radius="md"
                  fullWidth
                  leftSection={<IconLogout size={14} />}
                >
                  Logout
                </Button>
              </Stack>
            </Box>
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      {/* Content */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
