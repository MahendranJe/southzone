import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconArrowRight,
  IconCalendar,
  IconMapPin,
  IconTrain,
} from "@tabler/icons-react";
import Link from "next/link";

export interface TrainUpdate {
  id: number;
  trainNumber: string;
  fromStation: string;
  toStation: string;
  title: string;
  description: string;
  scheduleType: "Daily" | "Weekly" | "CustomDays" | "OneTime" | "DateRange";
  isPremium: boolean;
  isActive: boolean;
  imagePath?: string;
  scheduleBadgeText?: string;
  scheduleBadgeColor?: string;
  nextRunDate?: string;
}

const scheduleColorMap: Record<string, string> = {
  Daily: "green",
  Weekly: "blue",
  CustomDays: "violet",
  OneTime: "orange",
  DateRange: "cyan",
};

interface TrainCardProps {
  train: TrainUpdate;
  canViewPremium?: boolean;
}

export function TrainCard({ train }: TrainCardProps) {
  const scheduleColor =
    train.scheduleBadgeColor ?? scheduleColorMap[train.scheduleType] ?? "gray";

  return (
    <Card shadow="sm" radius="lg" withBorder className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      <Stack gap="sm" className="flex-1 p-1 pt-3">
        {/* Train number + badges */}
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <IconTrain size={16} className="text-violet-600 mt-0.5" />
            <Text fw={700} size="sm" c="railwayPurple">
              {train.trainNumber}
            </Text>
          </Group>
          <Badge size="xs" color={scheduleColor} variant="light">
            {train.scheduleBadgeText ?? train.scheduleType}
          </Badge>
        </Group>

        {/* Title */}
        <Text fw={600} size="md" lineClamp={2}>
          {train.title}
        </Text>

        {/* Route */}
        <Group gap="xs" wrap="nowrap">
          <IconMapPin size={14} className="text-gray-400 shrink-0" />
          <Text size="xs" c="dimmed" lineClamp={1}>
            {train.fromStation}
          </Text>
          <IconArrowRight size={12} className="text-gray-300 shrink-0" />
          <Text size="xs" c="dimmed" lineClamp={1}>
            {train.toStation}
          </Text>
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={3} className="flex-1">
          {train.description}
        </Text>

        {/* Next run + action */}
        <Group justify="space-between" align="center" mt="auto">
          {train.nextRunDate && (
            <Group gap={4}>
              <IconCalendar size={13} className="text-gray-400" />
              <Text size="xs" c="dimmed">
                {new Date(train.nextRunDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </Text>
            </Group>
          )}
          <Button
            component={Link}
            href={`/trains/${train.id}`}
            size="xs"
            variant="light"
            color="railwayPurple"
            ml="auto"
            rightSection={<IconArrowRight size={12} />}
          >
            View
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
