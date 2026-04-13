"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  FileInput,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconFileUpload, IconSparkles } from "@tabler/icons-react";

type ExtractedDocument = {
  name: string | null;
  date_of_birth: string | null;
  address: string | null;
  id_number: string | null;
  phone_number: string | null;
  email: string | null;
  description_tamil: string | null;
};

const EMPTY_FORM: ExtractedDocument = {
  name: null,
  date_of_birth: null,
  address: null,
  id_number: null,
  phone_number: null,
  email: null,
  description_tamil: null,
};

export function DocumentAutoFill() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string>("");
  const [form, setForm] = useState<ExtractedDocument>(EMPTY_FORM);

  const onExtract = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = new FormData();
      payload.append("file", file);

      const res = await fetch("/api/extract", {
        method: "POST",
        body: payload,
      });

      const data = (await res.json()) as {
        error?: string;
        result?: ExtractedDocument;
        ocrText?: string;
      };

      if (!res.ok || data.error) {
        throw new Error(data.error || "Unable to process document");
      }

      setForm({ ...EMPTY_FORM, ...(data.result ?? {}) });
      setOcrPreview(data.ocrText ?? "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="sm" radius="lg" p="xl" withBorder mt="lg">
      <Group mb="md" gap="xs">
        <IconSparkles size={18} className="text-violet-600" />
        <Title order={4}>Document Auto Fill (OCR + AI)</Title>
      </Group>

      <Stack gap="md">
        <FileInput
          accept="image/*"
          label="Upload document image"
          placeholder="Choose an image"
          value={file}
          onChange={setFile}
          leftSection={<IconFileUpload size={16} />}
        />

        <Group>
          <Button onClick={onExtract} loading={loading} disabled={!file}>
            Extract & Auto-fill
          </Button>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Name (Tamil)"
            value={form.name ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.currentTarget.value || null }))
            }
          />
          <TextInput
            label="Date of Birth (DD-MM-YYYY)"
            value={form.date_of_birth ?? ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                date_of_birth: event.currentTarget.value || null,
              }))
            }
          />
          <TextInput
            label="ID Number"
            value={form.id_number ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, id_number: event.currentTarget.value || null }))
            }
          />
          <TextInput
            label="Phone Number"
            value={form.phone_number ?? ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                phone_number: event.currentTarget.value || null,
              }))
            }
          />
          <TextInput
            label="Email"
            value={form.email ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.currentTarget.value || null }))
            }
          />
          <TextInput
            label="Address (Tamil)"
            value={form.address ?? ""}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, address: event.currentTarget.value || null }))
            }
          />
        </SimpleGrid>

        <Textarea
          label="Tamil Description"
          minRows={3}
          value={form.description_tamil ?? ""}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              description_tamil: event.currentTarget.value || null,
            }))
          }
        />

        {ocrPreview && (
          <>
            <Text size="sm" fw={600}>
              OCR Preview
            </Text>
            <Paper withBorder p="sm" radius="md" style={{ whiteSpace: "pre-wrap" }}>
              <Text size="xs" c="dimmed">
                {ocrPreview}
              </Text>
            </Paper>
          </>
        )}
      </Stack>
    </Paper>
  );
}
