import { Box, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import type { TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: TablerIcon;
  color?: string;
  gradient?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "railwayPurple",
  gradient = false,
}: StatCardProps) {
  return (
    <Paper
      p="md"
      radius="lg"
      shadow="sm"
      withBorder
      className="hover:shadow-md transition-shadow duration-200"
    >
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
            {label}
          </Text>
          <Text fw={800} size="xl">
            {value}
          </Text>
        </Box>
        <ThemeIcon
          size="xl"
          radius="lg"
          variant={gradient ? "gradient" : "light"}
          color={gradient ? undefined : color}
          gradient={
            gradient
              ? { from: "#667eea", to: "#764ba2", deg: 135 }
              : undefined
          }
        >
          <Icon size={22} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
