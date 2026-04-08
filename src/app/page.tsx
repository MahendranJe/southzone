"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconBell,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconSearch,
  IconTrain,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { TatkalTimer } from "@/components/shared/TatkalTimer";

const features = [
  {
    icon: IconTrain,
    title: "Live Train Updates",
    description:
      "Real-time schedule updates for all Southzone Railway trains including Rajdhani, Shatabdi, and express services.",
    color: "violet",
  },
  {
    icon: IconAlertCircle,
    title: "Custom Alerts",
    description:
      "Set personalized alerts for specific trains and travel dates. Get notified the moment details change.",
    color: "orange",
  },
  {
    icon: IconBell,
    title: "Instant Notifications",
    description:
      "Never miss an update. Our system keeps you informed about your booked train status in real time.",
    color: "blue",
  },
  {
    icon: IconUsers,
    title: "100% Free",
    description:
      "All features are completely free for every user. Create an account and access all train updates and alerts.",
    color: "green",
  },
];

export default function HomePage() {
  return (
    <MainLayout>
      {/* Hero */}
      <Box style={{ background: "var(--railway-gradient)" }} py={{ base: 60, md: 100 }}>
        <Container size="xl">
          <Stack align="center" gap="lg" ta="center">
            <TatkalTimer />
            <Group gap="md" justify="center">
              <Image
                src="/logo.png"
                alt="Southzone Railway Update"
                width={80}
                height={80}
                style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.5)" }}
              />
            </Group>
            <Title
              order={1}
              c="white"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800 }}
            >
              Real-Time Railway Updates
              <br />
              <span style={{ color: "rgba(255,255,255,0.85)" }}>
                at Your Fingertips
              </span>
            </Title>
            <Text c="rgba(255,255,255,0.85)" size="lg" maw={580}>
              Track live train schedules, set custom alerts, and never miss a
              Southzone Railway update. Trusted by thousands of daily commuters.
            </Text>
            <Group gap="md" justify="center" mt="sm">
              <Button
                component={Link}
                href="/trains"
                size="lg"
                radius="xl"
                variant="white"
                color="railwayPurple"
                rightSection={<IconSearch size={18} />}
              >
                Browse Trains
              </Button>
              <Button
                component={Link}
                href="/register"
                size="lg"
                radius="xl"
                variant="outline"
                color="white"
              >
                Join Free
              </Button>
            </Group>
            {/* Social Links */}
            <Group gap="md" justify="center" mt="xs">
              <Button
                component="a"
                href="https://whatsapp.com/channel/0029Va6gl6EFcow4AOH5UC3i"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                color="white"
                size="sm"
                radius="xl"
                leftSection={<IconBrandWhatsapp size={16} />}
              >
                WhatsApp Channel
              </Button>
              <Button
                component="a"
                href="https://www.instagram.com/southzone_railwayupdate?igsh=MTFmbnczNGhzN2hmZQ=="
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                color="white"
                size="sm"
                radius="xl"
                leftSection={<IconBrandInstagram size={16} />}
              >
                Instagram
              </Button>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 4 }} mt="xl" spacing="md">
              {[
                { label: "Active Trains", value: "150+" },
                { label: "Daily Updates", value: "500+" },
                { label: "Users", value: "18K+" },
                { label: "Alerts Sent", value: "2L+" },
              ].map((s) => (
                <Box
                  key={s.label}
                  p="md"
                  className="rounded-xl text-center"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <Text fw={800} size="xl" c="white">{s.value}</Text>
                  <Text size="xs" c="rgba(255,255,255,0.75)">{s.label}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* Features */}
      <Container size="xl" py={80}>
        <Stack align="center" mb="xl" gap="xs">
          <Badge color="railwayPurple" variant="light" size="lg">Features</Badge>
          <Title order={2} ta="center">Everything you need to track trains</Title>
          <Text c="dimmed" ta="center" maw={480}>
            A complete platform for Southzone Railway passengers to stay updated.
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {features.map((f) => (
            <Card key={f.title} shadow="sm" radius="lg" withBorder p="lg">
              <ThemeIcon size="xl" radius="lg" color={f.color} variant="light" mb="md">
                <f.icon size={22} />
              </ThemeIcon>
              <Text fw={700} mb="xs">{f.title}</Text>
              <Text size="sm" c="dimmed">{f.description}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* CTA */}
      <Box style={{ background: "var(--railway-gradient)" }} py={64} ta="center">
        <Container size="sm">
          <Group justify="center" mb="md">
            <Image
              src="/logo.png"
              alt="Southzone Railway Update"
              width={64}
              height={64}
              style={{ borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.4)" }}
            />
          </Group>
          <Title order={2} c="white" mb="sm">Join 10,000+ Railway Passengers</Title>
          <Text c="rgba(255,255,255,0.85)" mb="xl">
            Create a free account and start tracking your trains today â€” completely free, always.
          </Text>
          <Group justify="center" gap="md">
            <Button
              component={Link} href="/register"
              size="lg" radius="xl" variant="white" color="railwayPurple"
            >
              Create Free Account
            </Button>
            <Button
              component="a"
              href="https://whatsapp.com/channel/0029Va6gl6EFcow4AOH5UC3i"
              target="_blank"
              rel="noopener noreferrer"
              size="lg" radius="xl" variant="outline" color="white"
              leftSection={<IconBrandWhatsapp size={18} />}
            >
              Join WhatsApp
            </Button>
          </Group>
        </Container>
      </Box>
    </MainLayout>
  );
}
