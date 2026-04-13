import {
  Badge,
  Box,
  Button,
  Container,
  Grid,
  GridCol,
  Group,
  List,
  ListItem,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconTrain,
} from "@tabler/icons-react";
import { notFound, redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export default async function TrainDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/trains/${id}`)}`);
  }

  const trainId = Number(id);
  if (isNaN(trainId)) notFound();

  const train = await prisma.train.findFirst({
    where: { id: trainId, isActive: true },
  });

  if (!train) notFound();

  return (
    <MainLayout>
      {/* Header */}
      <Box style={{ background: "var(--railway-gradient)" }} py={40}>
        <Container size="xl">
          <Button
            component="a"
            href="/trains"
            variant="subtle"
            color="white"
            leftSection={<IconArrowLeft size={16} />}
            mb="md"
            size="sm"
          >
            Back to Trains
          </Button>
          <Group gap="md" wrap="nowrap" align="flex-start">
            <ThemeIcon
              size={56}
              radius="xl"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <IconTrain size={28} color="white" />
            </ThemeIcon>
            <Stack gap="xs">
              <Group gap="xs">
                <Badge
                  color={train.scheduleBadgeColor ?? "blue"}
                  variant="filled"
                  size="sm"
                >
                  {train.scheduleBadgeText ?? train.scheduleType}
                </Badge>
              </Group>
              <Title order={2} c="white">
                {train.title}
              </Title>
              <Group gap="md">
                <Group gap={4}>
                  <IconTrain size={14} color="rgba(255,255,255,0.7)" />
                  <Text size="sm" c="rgba(255,255,255,0.85)" fw={600}>
                    {train.trainNumber}
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconMapPin size={14} color="rgba(255,255,255,0.7)" />
                  <Text size="sm" c="rgba(255,255,255,0.75)">
                    {train.fromStation} → {train.toStation}
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Group>
        </Container>
      </Box>

      <Container size="xl" py="xl">
        <Grid gutter="xl">
          {/* Main content */}
          <GridCol span={{ base: 12, md: 8 }}>
            <Paper shadow="sm" radius="lg" p="xl" withBorder mb="lg">
              <Title order={4} mb="md">
                Update Details
              </Title>
              <div
                style={{ fontSize: 15, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: train.description }}
              />
              <Text size="xs" c="dimmed" mt="md">
                Last updated: {dayjs(train.updatedAt).format("DD MMM YYYY, hh:mm A")}
              </Text>
            </Paper>

            {/* Additional info for logged-in users */}
            <Paper shadow="sm" radius="lg" p="xl" withBorder>
              <Group mb="md">
                <IconCalendar size={18} className="text-violet-600" />
                <Title order={4}>Schedule Information</Title>
              </Group>
              <List spacing="sm" size="sm">
                <ListItem>
                  <strong>Schedule Type:</strong> {train.scheduleType}
                </ListItem>
                <ListItem>
                  <strong>Next Run:</strong> {train.nextRunDate ?? "—"}
                </ListItem>
                {train.startDate && (
                  <ListItem>
                    <strong>Effective From:</strong> {dayjs(train.startDate).format("DD MMM YYYY")}
                  </ListItem>
                )}
                {train.endDate && (
                  <ListItem>
                    <strong>Effective Until:</strong> {dayjs(train.endDate).format("DD MMM YYYY")}
                  </ListItem>
                )}
                <ListItem>
                  <strong>Route:</strong> {train.fromStation} → {train.toStation}
                </ListItem>
              </List>
            </Paper>

            <Paper shadow="sm" radius="lg" p="xl" withBorder mt="lg">
              <Title order={4} mb="md">Time Table</Title>
              {train.imageUrl ? (
                <img
                  src={train.imageUrl}
                  alt={`${train.title} image`}
                  style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 10 }}
                />
              ) : (
                <Text size="sm" c="dimmed">No image uploaded for this train yet.</Text>
              )}
            </Paper>
          </GridCol>

          {/* Sidebar */}
          <GridCol span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              {/* Quick info card */}
              <Paper shadow="sm" radius="lg" p="lg" withBorder>
                <Title order={5} mb="md">Quick Info</Title>
                <Stack gap="sm">
                  {[
                    { icon: IconTrain, label: "Train No.", value: train.trainNumber },
                    { icon: IconMapPin, label: "From", value: train.fromStation },
                    { icon: IconMapPin, label: "To", value: train.toStation },
                    { icon: IconClock, label: "Schedule", value: train.scheduleBadgeText ?? train.scheduleType },
                    { icon: IconCalendar, label: "Next Run", value: train.nextRunDate ?? "—" },
                  ].map((item) => (
                    <Group key={item.label} justify="space-between" gap="xs">
                      <Group gap="xs">
                        <item.icon size={14} className="text-gray-400" />
                        <Text size="sm" c="dimmed">{item.label}</Text>
                      </Group>
                      <Text size="sm" fw={600}>{item.value}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>

              {/* Set alert CTA */}
              <Paper
                shadow="sm"
                radius="lg"
                p="lg"
                withBorder
                style={{ background: "rgba(102,126,234,0.05)" }}
              >
                <Group gap="xs" mb="sm">
                  <IconAlertCircle size={18} className="text-violet-600" />
                  <Text fw={600} size="sm">Set an Alert</Text>
                </Group>
                <Text size="xs" c="dimmed" mb="md">
                  Get notified when there are updates for this train.
                </Text>
                <Button
                  component="a"
                  href="/alerts"
                  fullWidth
                  size="sm"
                  radius="xl"
                  color="railwayPurple"
                  variant="light"
                >
                  Create Alert
                </Button>
              </Paper>
            </Stack>
          </GridCol>
        </Grid>
      </Container>
    </MainLayout>
  );
}
