"use client";

import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCalendar, IconSearch, IconTrain, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TrainCard, TrainUpdate } from "@/components/trains/TrainCard";

export default function TrainsPage() {
  const [search, setSearch] = useState("");
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [debouncedFrom] = useDebouncedValue(fromStation, 400);
  const [debouncedTo] = useDebouncedValue(toStation, 400);

  const [trains, setTrains] = useState<TrainUpdate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(debouncedFrom && { from: debouncedFrom }),
      ...(debouncedTo && { to: debouncedTo }),
      ...(scheduleFilter && { scheduleType: scheduleFilter }),
    });
    setLoading(true);
    fetch(`/api/trains?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setTrains(data.trains ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setTrains([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, debouncedFrom, debouncedTo, scheduleFilter, page]);

  const totalPages = Math.ceil(total / pageSize);

  const clearFilters = () => {
    setSearch("");
    setFromStation("");
    setToStation("");
    setScheduleFilter(null);
    setPage(1);
  };

  const hasFilters = search || fromStation || toStation || scheduleFilter;

  return (
    <MainLayout>
      {/* Header */}
      <Box style={{ background: "var(--railway-gradient)" }} py={{ base: 24, md: 30 }}>
        <Container size="xl">
          <Stack gap={4}>
            <Group gap="xs">
              <IconTrain size={20} color="white" />
              <Title order={2} c="white">Train Updates</Title>
            </Group>
            <Text c="rgba(255,255,255,0.8)">
              Browse real-time schedule updates for all Southzone Railway trains
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={{ base: "md", md: "lg" }}>
        {/* Filters */}
        <Paper shadow="sm" radius="lg" p="lg" mb="xl" withBorder>
          <Grid gutter="md" align="flex-end">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="Search trains"
                placeholder="Train number, title..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="From Station"
                placeholder="Departure station"
                value={fromStation}
                onChange={(e) => { setFromStation(e.target.value); setPage(1); }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                label="To Station"
                placeholder="Destination station"
                value={toStation}
                onChange={(e) => { setToStation(e.target.value); setPage(1); }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
              <Select
                label="Schedule"
                placeholder="All types"
                data={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "CustomDays", label: "Custom Days" },
                  { value: "DateRange", label: "Date Range" },
                  { value: "OneTime", label: "One Time" },
                ]}
                value={scheduleFilter}
                onChange={(v) => { setScheduleFilter(v); setPage(1); }}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 1 }}>
              {hasFilters && (
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={14} />}
                  onClick={clearFilters}
                  fullWidth
                  mt={24}
                >
                  Clear
                </Button>
              )}
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Results header */}
        <Group justify="space-between" mb="lg">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Showing <strong>{trains.length}</strong> of <strong>{total}</strong> results
            </Text>
            {hasFilters && (
              <Badge color="railwayPurple" variant="light" size="sm">Filtered</Badge>
            )}
          </Group>
        </Group>

        {/* Grid of cards */}
        {loading ? (
          <Center py="xl"><Loader color="railwayPurple" /></Center>
        ) : trains.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {trains.map((train) => (
              <TrainCard key={train.id} train={train} canViewPremium={false} />
            ))}
          </SimpleGrid>
        ) : (
          <Paper p="xl" radius="lg" ta="center" withBorder>
            <IconTrain size={40} className="text-gray-300 mx-auto mb-3" />
            <Text fw={600} mb="xs">No trains found</Text>
            <Text size="sm" c="dimmed">Try adjusting your search filters</Text>
            <Button variant="subtle" color="railwayPurple" mt="md" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Paper>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              color="railwayPurple"
              radius="md"
            />
          </Group>
        )}
      </Container>
    </MainLayout>
  );
}

