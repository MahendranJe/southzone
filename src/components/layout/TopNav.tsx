"use client";

import {
  ActionIcon,
  Avatar,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Train Updates", href: "/trains" },
  { label: "Alerts", href: "/alerts" },
  { label: "Notifications", href: "/notifications" },
];

export function TopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const displayName = session?.user?.name ?? "My Account";
  const isAdminUser =
    isAdmin || session?.user?.role === "ADMIN";

  return (
    <Box
      component="header"
      className="sticky top-0 z-50 shadow-md"
      style={{ background: "var(--railway-gradient)" }}
    >
      <Container size="xl" py="sm">
        <Group justify="space-between" align="center">
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Group gap="xs">
              <Image
                src="/logo.png"
                alt="Southzone Railway Update"
                width={40}
                height={40}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
              <Stack gap={0} visibleFrom="sm">
                <Text fw={800} size="sm" c="white" lh={1.2}>
                  Southzone
                </Text>
                <Text size="xs" c="rgba(255,255,255,0.85)" lh={1.2}>
                  Railway Update
                </Text>
              </Stack>
            </Group>
          </Link>

          {/* Desktop nav */}
          <Group gap="xs" visibleFrom="md">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                variant={isActive(link.href) ? "white" : "subtle"}
                color={isActive(link.href) ? "railwayPurple" : "white"}
                size="sm"
                radius="md"
              >
                {link.label}
              </Button>
            ))}
            {isAdminUser && (
              <Button
                component={Link}
                href="/admin"
                variant={isActive("/admin") ? "white" : "subtle"}
                color={isActive("/admin") ? "railwayPurple" : "white"}
                size="sm"
                radius="md"
              >
                Admin
              </Button>
            )}
          </Group>

          {/* Right side */}
          <Group gap="xs">
            {/* Color scheme toggle */}
            <ActionIcon
              variant="subtle"
              color="white"
              size="lg"
              radius="md"
              onClick={() => toggleColorScheme()}
            >
              {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            {/* User menu / login */}
            {session?.user ? (
              <Menu shadow="lg" radius="md" width={200}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="xs">
                      <Avatar
                        size="sm"
                        radius="xl"
                        src="/logo.png"
                        style={{ border: "2px solid rgba(255,255,255,0.5)" }}
                      />
                      <Text size="sm" c="white" visibleFrom="sm" maw={100} truncate>
                        {displayName}
                      </Text>
                      <IconChevronDown size={14} color="white" />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size="xs" c="dimmed">Signed in as</Text>
                    <Text size="sm" fw={600} truncate>{displayName}</Text>
                  </Menu.Label>
                  <Menu.Divider />
                  <Menu.Item leftSection={<IconUser size={14} />}>Profile</Menu.Item>
                  <Menu.Item leftSection={<IconSettings size={14} />}>Settings</Menu.Item>
                  {isAdminUser && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        component={Link}
                        href="/admin"
                        leftSection={<IconSettings size={14} />}
                      >
                        Admin Dashboard
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={14} />}
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap="xs">
                <Button
                  component={Link}
                  href="/login"
                  variant="subtle"
                  color="white"
                  size="sm"
                  radius="md"
                  visibleFrom="sm"
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="white"
                  color="railwayPurple"
                  size="sm"
                  radius="md"
                >
                  Sign Up
                </Button>
              </Group>
            )}

            {/* Mobile burger */}
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="md"
              color="white"
              size="sm"
            />
          </Group>
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <Image src="/logo.png" alt="Logo" width={32} height={32} style={{ borderRadius: "50%" }} />
            <Text fw={700}>Southzone Railway Update</Text>
          </Group>
        }
        size="xs"
      >
        <Stack gap="xs" mt="md">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              component={Link}
              href={link.href}
              variant={isActive(link.href) ? "filled" : "subtle"}
              color="railwayPurple"
              radius="md"
              fullWidth
              justify="flex-start"
              onClick={close}
            >
              {link.label}
            </Button>
          ))}
          {isAdminUser && (
            <Button
              component={Link}
              href="/admin"
              variant="subtle"
              color="railwayPurple"
              radius="md"
              fullWidth
              justify="flex-start"
              onClick={close}
            >
              Admin Dashboard
            </Button>
          )}
          <Box mt="md">
            {session?.user ? (
              <Button
                color="red"
                variant="light"
                fullWidth
                radius="md"
                leftSection={<IconLogout size={14} />}
                onClick={() => { signOut({ callbackUrl: "/login" }); close(); }}
              >
                Logout
              </Button>
            ) : (
              <Group grow>
                <Button component={Link} href="/login" variant="outline" color="railwayPurple" radius="md" onClick={close}>Login</Button>
                <Button component={Link} href="/register" color="railwayPurple" radius="md" onClick={close}>Sign Up</Button>
              </Group>
            )}
          </Box>
        </Stack>
      </Drawer>
    </Box>
  );
}
