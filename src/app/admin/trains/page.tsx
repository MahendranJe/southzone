"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Button,
  Divider,
  FileInput,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import SubScript from "@tiptap/extension-subscript";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendar,
  IconEdit,
  IconEye,
  IconPhoto,
  IconPlus,
  IconScan,
  IconTrash,
  IconTrain,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { runOCR, parseTimetable, normalizeTimetableData, type TimetableData, type TimetableDirection, type RouteStop } from "@/lib/ocrExtract";

interface TrainRecord {
  id: number;
  trainNumber: string;
  title: string;
  fromStation: string;
  toStation: string;
  description: string;
  timeTableJson: string | null;
  scheduleType: string;
  scheduleDays: string | null;
  isPremium: boolean;
  isActive: boolean;
  imageUrl: string | null;
  scheduleBadgeText: string | null;
  scheduleBadgeColor: string | null;
  startDate: string | null;
  endDate: string | null;
  nextRunDate: string | null;
  updatedAt: string;
}

const scheduleColors: Record<string, string> = {
  Daily: "green",
  Weekly: "blue",
  CustomDays: "violet",
  OneTime: "orange",
  DateRange: "cyan",
};

const weekDayValues = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ALL_DAYS_VALUE = "ALL_DAYS";

const dayOptions = [
  { value: ALL_DAYS_VALUE, label: "All Days" },
  ...weekDayValues.map((d) => ({
  value: d,
  label: d,
  })),
];

interface TrainForm {
  trainNumber: string;
  title: string;
  fromStation: string;
  toStation: string;
  description: string;
}

interface ExtractedDirection {
  train_number: string | null;
  train_name_tamil: string | null;
  from_station_tamil: string | null;
  to_station_tamil: string | null;
  operating_days_tamil: string | null;
  date_range_tamil: string | null;
  services_count_tamil: string | null;
  booking_info_tamil: string | null;
  stops: Array<{
    station_name_tamil: string | null;
    arrival_time: string | null;
    departure_time: string | null;
  }>;
}

const emptyForm: TrainForm = {
  trainNumber: "",
  title: "",
  fromStation: "",
  toStation: "",
  description: "",
};

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseScheduleDays(scheduleDays: string | null): string[] {
  if (!scheduleDays) return [];
  try {
    const parsed = JSON.parse(scheduleDays);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AdminTrainsPage() {
  const [trains, setTrains] = useState<TrainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [scheduleType, setScheduleType] = useState<string | null>("Daily");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [runningDate, setRunningDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [runsPerWeek, setRunsPerWeek] = useState<string | null>("2");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedTimetable, setExtractedTimetable] = useState<TimetableData | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<TrainForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewTrain, setViewTrain] = useState<TrainRecord | null>(null);
  const [viewOpened, viewModal] = useDisclosure(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setForm((f) => ({ ...f, description: editor.getHTML() }));
    },
  });

  const fetchTrains = useCallback(() => {
    setLoading(true);
    fetch("/api/trains?pageSize=50")
      .then((r) => r.json())
      .then((d) => setTrains(d.trains ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTrains(); }, [fetchTrains]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedDays([]);
    setScheduleType("Daily");
    setRunningDate(null);
    setStartDate(null);
    setEndDate(null);
    setRunsPerWeek("2");
    setUploadedImage(null);
    setUploadedImageFile(null);
    setOcrPreview("");
    setExtractedTimetable(null);
    setOcrRawText(null);
    setOcrProcessing(false);
    setOcrProgress(0);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    editor?.commands.setContent("");
    open();
  };

  const openEdit = (train: TrainRecord) => {
    setEditingId(train.id);
    setForm({
      trainNumber: train.trainNumber,
      title: train.title,
      fromStation: train.fromStation,
      toStation: train.toStation,
      description: train.description,
    });
    editor?.commands.setContent(train.description ?? "");
    setScheduleType(train.scheduleType);
    const parsedDays = parseScheduleDays(train.scheduleDays).filter((day) => weekDayValues.includes(day));
    setSelectedDays(parsedDays);
    setRunningDate(train.nextRunDate ? new Date(train.nextRunDate) : null);
    setStartDate(train.startDate);
    setEndDate(train.endDate);
    setUploadedImage(train.imageUrl ?? null);
    setUploadedImageFile(null);
    setOcrPreview("");
    if (train.timeTableJson) {
      try {
        setExtractedTimetable(normalizeTimetableData(JSON.parse(train.timeTableJson)));
      } catch {
        setExtractedTimetable(null);
      }
    } else {
      setExtractedTimetable(null);
    }
    open();
  };

  const openView = (train: TrainRecord) => {
    setViewTrain(train);
    viewModal.open();
  };

  const readImageFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifications.show({ title: "Invalid file", message: "Please upload an image file.", color: "red" });
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });
    if (!dataUrl) {
      notifications.show({ title: "Upload failed", message: "Could not read image file.", color: "red" });
      return;
    }
    setUploadedImageFile(file);
    setUploadedImage(dataUrl);
    notifications.show({ title: "Image uploaded", message: "Time Table is ready to save.", color: "green" });
  };

  const buildDescriptionHtml = (dirs: ExtractedDirection[]) => {
    const parts: string[] = [];

    parts.push(`<p><strong>பயணிகளின் கனிவான கவனத்திற்கு</strong></p>`);
    parts.push(`<br/>`);

    for (const dir of dirs) {
      // Train number + route + operating days
      const routeText = [dir.from_station_tamil, dir.to_station_tamil].filter(Boolean).join(" - ");
      const daysText = dir.operating_days_tamil ? ` (${dir.operating_days_tamil})` : "";
      if (dir.train_number || routeText) {
        parts.push(`<p><strong>ரயில் எண் ${dir.train_number ?? ""}: ${routeText}${daysText}</strong></p>`);
      }

      // Date range + service count
      if (dir.date_range_tamil || dir.services_count_tamil) {
        const dateStr = dir.date_range_tamil ?? "";
        const svcStr = dir.services_count_tamil ? ` (${dir.services_count_tamil})` : "";
        parts.push(`<p>காலம்: ${dateStr}${svcStr}</p>`);
      }

      parts.push(`<br/>`);
    }

    // Booking info from first direction that has it
    const bookingInfo = dirs.find((d) => d.booking_info_tamil)?.booking_info_tamil;
    if (bookingInfo) {
      parts.push(`<p>${bookingInfo}</p>`);
    }

    return parts.join("") || "<p></p>";
  };

  const buildLocalDescriptionHtml = (timetable: TimetableData) => {
    const descParts: string[] = [];
    for (const dir of timetable.directions) {
      const route = [dir.from, dir.to].filter(Boolean).join(" → ");
      const header = [dir.trainNumber, route].filter(Boolean).join(" : ");
      if (header) descParts.push(`<p><strong>${header}</strong></p>`);
      if (dir.operatingDays.length > 0) {
        descParts.push(`<p>Days: ${dir.operatingDays.join(", ")}</p>`);
      }
      if (dir.departureTime) {
        descParts.push(
          `<p>Departure: ${dir.departureTime} | Arrival: ${dir.arrivalTime ?? "--"}</p>`
        );
      }
    }
    return descParts.join("");
  };

  const applyLocalTimetable = (timetable: TimetableData) => {
    setExtractedTimetable(timetable);
    const first = timetable.directions[0];

    setForm((f) => ({
      ...f,
      trainNumber: first?.trainNumber ?? f.trainNumber,
      fromStation: first?.from ?? f.fromStation,
      toStation: first?.to ?? f.toStation,
    }));

    const descHtml = buildLocalDescriptionHtml(timetable);
    if (descHtml) {
      setForm((f) => ({
        ...f,
        description: f.description || descHtml,
      }));
      if (!form.description) {
        editor?.commands.setContent(descHtml);
      }
    }
  };

  const handleExtractAndAutofill = async () => {
    if (!uploadedImageFile) {
      notifications.show({
        title: "Upload required",
        message: "Please upload a timetable image first.",
        color: "red",
      });
      return;
    }

    let ocrTextForAi = ocrRawText?.trim() ?? "";

    try {
      setExtracting(true);
      if (!ocrTextForAi && uploadedImage) {
        setOcrProcessing(true);
        setOcrProgress(0);
        ocrTextForAi = await runOCR(uploadedImage, setOcrProgress);
        setOcrRawText(ocrTextForAi);
      }

      const payload = new FormData();
      payload.append("file", uploadedImageFile);
      payload.append("ocrLanguage", "eng");
      if (ocrTextForAi) {
        payload.append("ocrText", ocrTextForAi);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      let res: Response;
      try {
        res = await fetch("/api/extract", {
          method: "POST",
          body: payload,
          signal: controller.signal,
        });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
          throw new Error(
            "AI Extract timed out after 180 seconds. Restart the dev server after updating .env.local, then try again. If it still times out, the OCR step is taking too long for this image."
          );
        }
        throw fetchErr;
      }
      clearTimeout(timeoutId);

      const data = (await res.json()) as {
        error?: string;
        directions?: ExtractedDirection[];
        ocrText?: string;
      };

      if (!res.ok || data.error || !data.directions?.length) {
        throw new Error(
          data.error ??
            "Extraction failed — check GEMINI_API_KEY or OPENAI_API_KEY in .env.local, then restart the dev server."
        );
      }

      const dirs = data.directions;
      const first = dirs[0];
      const nextDescription = buildDescriptionHtml(dirs);

      setForm((prev) => ({
        ...prev,
        trainNumber: first.train_number ?? prev.trainNumber,
        title: first.train_name_tamil ?? prev.title,
        fromStation: first.from_station_tamil ?? prev.fromStation,
        toStation: first.to_station_tamil ?? prev.toStation,
        description: nextDescription,
      }));
      editor?.commands.setContent(nextDescription);
      setOcrPreview(data.ocrText ?? "");

      // Build structured timetable data from AI result
      const timetable: TimetableData = {
        directions: dirs.map((dir) => ({
          trainNumber: dir.train_number,
          trainName: dir.train_name_tamil,
          from: dir.from_station_tamil,
          to: dir.to_station_tamil,
          departureTime: dir.stops?.[0]?.departure_time ?? null,
          arrivalTime: dir.stops?.[dir.stops.length - 1]?.arrival_time ?? null,
          route: (dir.stops ?? []).map((s) => ({
            station: s.station_name_tamil ?? "",
            arrival: s.arrival_time ?? "--",
            departure: s.departure_time ?? "--",
          })),
          operatingDays: [],
          notes: dir.operating_days_tamil ?? "",
        })),
      };
      setExtractedTimetable(timetable);

      notifications.show({
        title: "Auto-fill complete",
        message: `Extracted ${dirs.length} direction(s) using OCR + AI.`,
        color: "green",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";

      if (ocrTextForAi && /quota exceeded|resource_exhausted|billing|Gemini API request failed|OpenAI request failed/i.test(message)) {
        const fallbackTimetable = parseTimetable(ocrTextForAi);
        applyLocalTimetable(fallbackTimetable);
        setOcrPreview(ocrTextForAi);

        notifications.show({
          title: "AI unavailable — local fallback used",
          message: "Gemini quota is unavailable, so basic train details were filled using local OCR. Tamil translation and rich auto-description require a working AI provider.",
          color: "yellow",
        });
        return;
      }

      notifications.show({
        title: "Extraction error",
        message,
        color: "red",
      });
    } finally {
      setOcrProcessing(false);
      setExtracting(false);
    }
  };

  const handleLocalOCR = async () => {
    if (!uploadedImage) {
      notifications.show({ title: "No image", message: "Upload an image first.", color: "red" });
      return;
    }
    setOcrProcessing(true);
    setOcrProgress(0);
    try {
      const text = await runOCR(uploadedImage, setOcrProgress);
      setOcrRawText(text);
      const timetable = parseTimetable(text);
      applyLocalTimetable(timetable);

      const totalStops = timetable.directions.reduce((sum, d) => sum + d.route.length, 0);
      notifications.show({ title: "OCR Complete", message: `Extracted ${timetable.directions.length} direction(s), ${totalStops} total stops. Use AI Extract for Tamil.`, color: "green" });
    } catch (err) {
      notifications.show({ title: "OCR Error", message: err instanceof Error ? err.message : "Failed", color: "red" });
    } finally {
      setOcrProcessing(false);
    }
  };

  const handleRemoveRouteStop = (dirIndex: number, stopIndex: number) => {
    if (!extractedTimetable) return;
    const newDirs = [...extractedTimetable.directions];
    newDirs[dirIndex] = {
      ...newDirs[dirIndex],
      route: newDirs[dirIndex].route.filter((_, i) => i !== stopIndex),
    };
    setExtractedTimetable({ directions: newDirs });
  };

  const handleUpdateRouteStop = (dirIndex: number, stopIndex: number, field: keyof RouteStop, value: string) => {
    if (!extractedTimetable) return;
    const newDirs = [...extractedTimetable.directions];
    const newRoute = [...newDirs[dirIndex].route];
    newRoute[stopIndex] = { ...newRoute[stopIndex], [field]: value };
    newDirs[dirIndex] = { ...newDirs[dirIndex], route: newRoute };
    setExtractedTimetable({ directions: newDirs });
  };

  const handleAddRouteStop = (dirIndex: number) => {
    if (!extractedTimetable) {
      setExtractedTimetable({
        directions: [{
          trainNumber: form.trainNumber || null,
          trainName: form.title || null,
          from: form.fromStation || null,
          to: form.toStation || null,
          departureTime: null,
          arrivalTime: null,
          route: [{ station: "", arrival: "--", departure: "--" }],
          operatingDays: [],
          notes: "",
        }],
      });
      return;
    }
    const newDirs = [...extractedTimetable.directions];
    newDirs[dirIndex] = {
      ...newDirs[dirIndex],
      route: [...newDirs[dirIndex].route, { station: "", arrival: "--", departure: "--" }],
    };
    setExtractedTimetable({ directions: newDirs });
  };

  const handleAddDirection = () => {
    const newDir: TimetableDirection = {
      trainNumber: null,
      trainName: null,
      from: null,
      to: null,
      departureTime: null,
      arrivalTime: null,
      route: [{ station: "", arrival: "--", departure: "--" }],
      operatingDays: [],
      notes: "",
    };
    if (!extractedTimetable) {
      setExtractedTimetable({ directions: [newDir] });
    } else {
      setExtractedTimetable({ directions: [...extractedTimetable.directions, newDir] });
    }
  };

  const buildScheduleBadgeText = () => {
    const displayDays = selectedDays.length === weekDayValues.length ? "All Days" : selectedDays.join(", ");
    if (scheduleType === "Daily") return "Daily";
    if (scheduleType === "OneTime") return runningDate ? `One Time • ${formatDate(runningDate)}` : "One Time";
    if (scheduleType === "DateRange") {
      const from = formatDate(startDate);
      const to = formatDate(endDate);
      const daysText = selectedDays.length ? ` • ${displayDays}` : "";
      return `Date Range • ${from} to ${to}${daysText}`;
    }
    if (scheduleType === "Weekly") {
      const dayText = selectedDays.length ? displayDays : "Select day(s)";
      return `Weekly ${runsPerWeek ?? "2"}x • ${dayText}`;
    }
    if (scheduleType === "CustomDays") {
      return selectedDays.length ? `Custom • ${displayDays}` : "Custom Days";
    }
    return scheduleType ?? "Schedule";
  };

  const applyDaySelection = (values: string[]) => {
    if (values.includes(ALL_DAYS_VALUE)) {
      setSelectedDays(weekDayValues);
      return;
    }
    setSelectedDays(values.filter((day) => weekDayValues.includes(day)));
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/trains/${id}`, { method: "DELETE" });
    notifications.show({ title: "Deleted", message: "Train update removed.", color: "red" });
    fetchTrains();
  };

  const handleSubmit = async () => {
    if (!form.trainNumber || !form.title || !form.fromStation || !form.toStation || !form.description) {
      notifications.show({ title: "Error", message: "Fill all required fields.", color: "red" });
      return;
    }

    if (["Weekly", "CustomDays", "DateRange"].includes(scheduleType ?? "") && selectedDays.length === 0) {
      notifications.show({
        title: "Running day required",
        message: "Please select at least one running day (or All Days).",
        color: "red",
      });
      return;
    }

    setSubmitting(true);

    const payload = {
      ...form,
      scheduleType: scheduleType ?? "Daily",
      scheduleDays: ["CustomDays", "Weekly", "DateRange"].includes(scheduleType ?? "") ? selectedDays : undefined,
      startDate: scheduleType === "DateRange" ? startDate ?? undefined : undefined,
      endDate: scheduleType === "DateRange" ? endDate ?? undefined : undefined,
      nextRunDate: runningDate ? formatDate(runningDate) : undefined,
      imageUrl: uploadedImage ?? undefined,
      timeTableJson: extractedTimetable ? JSON.stringify(extractedTimetable) : undefined,
      scheduleBadgeText: buildScheduleBadgeText(),
      scheduleBadgeColor: scheduleColors[scheduleType ?? "Daily"] ?? "gray",
    };

    const url = editingId ? `/api/trains/${editingId}` : "/api/trains";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    if (res.ok) {
      close();
      resetForm();
      notifications.show({
        title: editingId ? "Updated" : "Created",
        message: editingId ? "Train update saved." : "New train update added.",
        color: "green",
      });
      fetchTrains();
    } else {
      const err = await res.json();
      notifications.show({ title: "Error", message: err.error ?? "Failed to save", color: "red" });
    }
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Stack gap={2}>
          <Title order={3}>Train Updates</Title>
          <Text c="dimmed" size="sm">Manage train schedule updates and uploaded Time Tables</Text>
        </Stack>
        <Button
          leftSection={<IconPlus size={16} />}
          color="railwayPurple"
          radius="xl"
          onClick={openCreate}
        >
          Add Update
        </Button>
      </Group>

      {loading ? (
        <Center py="xl"><Loader color="railwayPurple" /></Center>
      ) : (
      <Paper shadow="sm" radius="lg" withBorder>
        <Box style={{ overflowX: "auto" }}>
        <Table highlightOnHover miw={980}>
          <Table.Thead>
            <Table.Tr style={{ background: "rgba(102,126,234,0.06)" }}>
              <Table.Th>Train No.</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Route</Table.Th>
              <Table.Th>Schedule</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Updated</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {trains.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td>
                  <Text fw={700} size="sm" c="railwayPurple">{t.trainNumber}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={1} maw={220}>{t.title}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{t.fromStation} → {t.toStation}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge size="xs" color={scheduleColors[t.scheduleType] ?? "gray"} variant="light">
                    {t.scheduleBadgeText ?? t.scheduleType}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge size="xs" color={t.isActive ? "green" : "red"} variant="light">
                    {t.isActive ? "Active" : "Inactive"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" color="teal" size="sm" onClick={() => openView(t)} title="View full details">
                      <IconEye size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="railwayPurple" size="sm" onClick={() => openEdit(t)}>
                      <IconEdit size={14} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDelete(t.id)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        </Box>
      </Paper>
      )}
      <Modal
        opened={opened}
        onClose={() => { close(); resetForm(); }}
        title={<Group gap="xs"><IconTrain size={18} className="text-violet-600" /><Text fw={700}>{editingId ? "Edit Train Update" : "Add Train Update"}</Text></Group>}
        size="xl"
        radius="lg"
        centered
      >
        <Stack gap="md">
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Train Number"
              placeholder="e.g. 12951"
              required
              value={form.trainNumber}
              onChange={(e) => setForm((f) => ({ ...f, trainNumber: e.target.value }))}
            />
            <TextInput
              label="Title"
              placeholder="Update title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </SimpleGrid>
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="From Station"
              placeholder="Departure"
              value={form.fromStation}
              onChange={(e) => setForm((f) => ({ ...f, fromStation: e.target.value }))}
            />
            <TextInput
              label="To Station"
              placeholder="Destination"
              value={form.toStation}
              onChange={(e) => setForm((f) => ({ ...f, toStation: e.target.value }))}
            />
          </SimpleGrid>
          <div>
            <Text size="sm" fw={500} mb={4}>Description</Text>
            <RichTextEditor editor={editor} style={{ minHeight: 200 }}>
              <RichTextEditor.Toolbar sticky stickyOffset={0}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.ClearFormatting />
                  <RichTextEditor.Highlight />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignCenter />
                  <RichTextEditor.AlignRight />
                </RichTextEditor.ControlsGroup>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link />
                  <RichTextEditor.Unlink />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>
              <RichTextEditor.Content />
            </RichTextEditor>
          </div>
          <Select
            label="Schedule Type"
            data={[
              { value: "Daily", label: "Daily" },
              { value: "Weekly", label: "Weekly (once / twice / thrice)" },
              { value: "CustomDays", label: "Custom Days (specific weekdays)" },
              { value: "DateRange", label: "Date Range" },
              { value: "OneTime", label: "One Time" },
            ]}
            value={scheduleType}
            onChange={setScheduleType}
            comboboxProps={{ withinPortal: false }}
          />
          {(scheduleType === "Weekly" || scheduleType === "CustomDays" || scheduleType === "DateRange") && (
            <SimpleGrid cols={2} spacing="md">
              <MultiSelect
                label="Running Day(s)"
                data={dayOptions}
                value={selectedDays}
                onChange={applyDaySelection}
                placeholder="Pick one or multiple days"
                required
                comboboxProps={{ withinPortal: false }}
              />
              {scheduleType === "Weekly" ? (
                <Select
                  label="Runs per Week"
                  data={[
                    { value: "1", label: "Once" },
                    { value: "2", label: "Twice" },
                    { value: "3", label: "Thrice" },
                  ]}
                  value={runsPerWeek}
                  onChange={setRunsPerWeek}
                  comboboxProps={{ withinPortal: false }}
                />
              ) : (
                <Text size="xs" c="dimmed" mt={26}>
                  Tip: Choose exact running days to help users understand the schedule clearly.
                </Text>
              )}
            </SimpleGrid>
          )}

          {(scheduleType === "OneTime" || scheduleType === "DateRange") && (
            <SimpleGrid cols={2} spacing="md">
              {scheduleType === "OneTime" ? (
                <DatePickerInput
                  label="Date of Running"
                  placeholder="Pick running date"
                  value={runningDate}
                  onChange={(v: string | Date | null) => setRunningDate(v ? new Date(v) : null)}
                  popoverProps={{ withinPortal: false }}
                />
              ) : (
                <DatePickerInput
                  label="Effective From"
                  placeholder="Pick start date"
                  value={startDate}
                  onChange={setStartDate}
                  popoverProps={{ withinPortal: false }}
                />
              )}
              {scheduleType === "DateRange" && (
                <DatePickerInput
                  label="Effective Until"
                  placeholder="Pick end date"
                  value={endDate}
                  onChange={setEndDate}
                  popoverProps={{ withinPortal: false }}
                />
              )}
            </SimpleGrid>
          )}

          <DatePickerInput
            label="Next Running Date (optional)"
            placeholder="Pick next expected running date"
            value={runningDate}
            onChange={(v: string | Date | null) => setRunningDate(v ? new Date(v) : null)}
            leftSection={<IconCalendar size={16} />}
            popoverProps={{ withinPortal: false }}
          />

          <Divider label="Time Table" labelPosition="left" />
          <FileInput
            label="Upload Time Table"
            placeholder="Select image file"
            leftSection={<IconPhoto size={16} />}
            accept="image/*"
            onChange={(file) => readImageFile(file)}
          />
          <Group justify="space-between" gap="xs" wrap="wrap">
            <Text size="xs" c="dimmed" style={{ flex: 1 }}>
              Upload image → extract timetable using AI or local OCR.
            </Text>
            <Group gap="xs">
              <Button
                variant="light"
                color="teal"
                size="xs"
                radius="xl"
                onClick={handleLocalOCR}
                loading={ocrProcessing}
                disabled={!uploadedImage}
                leftSection={<IconScan size={14} />}
              >
                {ocrProcessing ? `OCR ${ocrProgress}%` : "Local OCR"}
              </Button>
              <Button
                variant="light"
                color="violet"
                size="xs"
                radius="xl"
                onClick={handleExtractAndAutofill}
                loading={extracting}
                disabled={!uploadedImageFile}
              >
                AI Extract & Auto-fill
              </Button>
            </Group>
          </Group>
          {uploadedImage && (
            <Paper withBorder radius="md" p="sm">
              <Text size="xs" fw={700} mb="xs">Image Preview</Text>
              <img
                src={uploadedImage}
                alt="Train upload preview"
                style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 8, background: "#f8f9fa" }}
              />
            </Paper>
          )}
          {(ocrPreview || ocrRawText) && (
            <Paper withBorder radius="md" p="sm">
              <Text size="xs" fw={700} mb="xs">OCR Raw Text</Text>
              <Text size="xs" c="dimmed" style={{ whiteSpace: "pre-wrap", maxHeight: 150, overflow: "auto" }}>
                {ocrPreview || ocrRawText}
              </Text>
            </Paper>
          )}
          {extractedTimetable && extractedTimetable.directions.length > 0 && (
            <Stack gap="sm">
              {extractedTimetable.directions.map((dir, dirIdx) => (
                <Paper withBorder radius="md" p="sm" key={dirIdx}>
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      <Badge size="xs" variant="light" color={dirIdx === 0 ? "blue" : "orange"}>
                        Direction {dirIdx + 1}{dir.trainNumber ? ` • ${dir.trainNumber}` : ""}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {dir.from ?? "?"} → {dir.to ?? "?"} ({dir.route.length} stops)
                      </Text>
                    </Group>
                    <Button size="compact-xs" variant="subtle" color="teal" onClick={() => handleAddRouteStop(dirIdx)}>+ Add Stop</Button>
                  </Group>
                  <Box style={{ overflowX: "auto" }}>
                  <Table withTableBorder withColumnBorders fz="xs">
                    <Table.Thead>
                      <Table.Tr style={{ background: dirIdx === 0 ? "rgba(102,126,234,0.06)" : "rgba(234,156,102,0.06)" }}>
                        <Table.Th w={30}>#</Table.Th>
                        <Table.Th>Station</Table.Th>
                        <Table.Th w={90}>Arrival</Table.Th>
                        <Table.Th w={90}>Departure</Table.Th>
                        <Table.Th w={40}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {dir.route.map((stop, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>{i + 1}</Table.Td>
                          <Table.Td>
                            <TextInput
                              size="xs"
                              variant="unstyled"
                              value={stop.station}
                              onChange={(e) => handleUpdateRouteStop(dirIdx, i, "station", e.target.value)}
                              styles={{ input: { padding: 0, minHeight: 22 } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              size="xs"
                              variant="unstyled"
                              value={stop.arrival}
                              onChange={(e) => handleUpdateRouteStop(dirIdx, i, "arrival", e.target.value)}
                              styles={{ input: { padding: 0, minHeight: 22 } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              size="xs"
                              variant="unstyled"
                              value={stop.departure}
                              onChange={(e) => handleUpdateRouteStop(dirIdx, i, "departure", e.target.value)}
                              styles={{ input: { padding: 0, minHeight: 22 } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleRemoveRouteStop(dirIdx, i)}>
                              <IconTrash size={12} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  </Box>
                </Paper>
              ))}
              <Button size="xs" variant="subtle" color="violet" onClick={handleAddDirection}>
                + Add Another Direction
              </Button>
            </Stack>
          )}
          {!extractedTimetable && (
            <Button size="xs" variant="subtle" color="gray" onClick={() => handleAddRouteStop(0)}>
              + Add Route Stops Manually
            </Button>
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={() => { close(); resetForm(); }} radius="xl">Cancel</Button>
            <Button color="railwayPurple" radius="xl" onClick={handleSubmit} leftSection={editingId ? <IconEdit size={14} /> : <IconPlus size={14} />} loading={submitting}>
              {editingId ? "Save Changes" : "Create"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={viewOpened}
        onClose={viewModal.close}
        title={<Text fw={700}>Train Full Details</Text>}
        size="xl"
        centered
      >
        {viewTrain && (
          <Stack gap="md">
            <SimpleGrid cols={2}>
              <Text><strong>Train:</strong> {viewTrain.trainNumber}</Text>
              <Text><strong>Title:</strong> {viewTrain.title}</Text>
              <Text><strong>From:</strong> {viewTrain.fromStation}</Text>
              <Text><strong>To:</strong> {viewTrain.toStation}</Text>
              <Text><strong>Schedule:</strong> {viewTrain.scheduleBadgeText ?? viewTrain.scheduleType}</Text>
              <Text><strong>Updated:</strong> {formatDate(viewTrain.updatedAt)}</Text>
            </SimpleGrid>
            <Paper p="md" withBorder radius="md">
              <Text fw={700} mb="xs">Update Description</Text>
              <div
                style={{ fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: viewTrain.description }}
              />
            </Paper>
            <Paper p="md" withBorder radius="md">
              <Text fw={700} mb="xs">Time Table</Text>
              {viewTrain.imageUrl ? (
                <img
                  src={viewTrain.imageUrl}
                  alt={`${viewTrain.title} image`}
                  style={{ width: "100%", maxHeight: 500, objectFit: "contain", borderRadius: 8, background: "#f8f9fa" }}
                />
              ) : (
                <Text size="sm" c="dimmed">No image uploaded for this train yet.</Text>
              )}
            </Paper>
            {(() => {
              let timetable: TimetableData | null = null;
              if (viewTrain.timeTableJson) {
                try { timetable = normalizeTimetableData(JSON.parse(viewTrain.timeTableJson)); } catch { /* ignore */ }
              }
              if (!timetable || timetable.directions.length === 0) return null;
              return timetable.directions.map((dir: TimetableDirection, dirIdx: number) => {
                if (dir.route.length === 0) return null;
                return (
                  <Paper p="md" withBorder radius="md" key={dirIdx}>
                    <Group gap="xs" mb="xs">
                      <Badge size="sm" variant="light" color={dirIdx === 0 ? "blue" : "orange"}>
                        Direction {dirIdx + 1}{dir.trainNumber ? ` • ${dir.trainNumber}` : ""}
                      </Badge>
                      <Text size="xs" c="dimmed">{dir.from ?? "?"} → {dir.to ?? "?"}</Text>
                    </Group>
                    {dir.notes && <Text size="xs" c="dimmed" mb="xs">{dir.notes}</Text>}
                    <Box style={{ overflowX: "auto" }}>
                    <Table withTableBorder withColumnBorders fz="sm">
                      <Table.Thead>
                        <Table.Tr style={{ background: dirIdx === 0 ? "rgba(102,126,234,0.06)" : "rgba(234,156,102,0.06)" }}>
                          <Table.Th w={40}>#</Table.Th>
                          <Table.Th>Station</Table.Th>
                          <Table.Th w={100}>Arrival</Table.Th>
                          <Table.Th w={100}>Departure</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {dir.route.map((stop: RouteStop, i: number) => (
                          <Table.Tr key={i}>
                            <Table.Td>{i + 1}</Table.Td>
                            <Table.Td fw={500}>{stop.station}</Table.Td>
                            <Table.Td>{stop.arrival}</Table.Td>
                            <Table.Td>{stop.departure}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                    </Box>
                  </Paper>
                );
              });
            })()}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
