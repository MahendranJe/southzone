import { NextResponse } from "next/server";
import sharp from "sharp";
import Tesseract from "tesseract.js";

export const runtime = "nodejs";

const MASTER_PROMPT = `You are an OCR + Data Extraction + Translation assistant.

Step 1: Read the uploaded image OCR text and extract all visible text accurately.

Step 2: Identify and structure the following details:
- Train Number
- Train Name
- From Station
- To Station
- Operating Days
- Station List (with Arrival and Departure Times)

Step 3: Convert ALL extracted data into Tamil language.

Step 4: Return the output in STRICT JSON format like below:

{
  "train_number": "",
  "train_name_tamil": "",
  "from_station_tamil": "",
  "to_station_tamil": "",
  "operating_days_tamil": "",
  "stops": [
    {
      "station_name_tamil": "",
      "arrival_time": "",
      "departure_time": ""
    }
  ]
}

Rules:
- Do NOT return English (except numbers/time)
- Tamil must be natural and correct (example: Chennai Egmore -> சென்னை எக்மோர்)
- Maintain correct time format (HH:MM)
- If arrival/departure not available, return null
- Ensure JSON is valid (no extra text)
- If the image contains a timetable, carefully map each row to station name and corresponding arrival/departure time.`;

type ExtractedTrainStop = {
  station_name_tamil: string | null;
  arrival_time: string | null;
  departure_time: string | null;
};

type ExtractedTrainData = {
  train_number: string | null;
  train_name_tamil: string | null;
  from_station_tamil: string | null;
  to_station_tamil: string | null;
  operating_days_tamil: string | null;
  stops: ExtractedTrainStop[];
};

const EMPTY_RESULT: ExtractedTrainData = {
  train_number: null,
  train_name_tamil: null,
  from_station_tamil: null,
  to_station_tamil: null,
  operating_days_tamil: null,
  stops: [],
};

const ALLOWED_OCR_LANGUAGES = new Set(["eng", "eng+tam"]);

async function preprocessImageForOcr(imageBuffer: Buffer) {
  return sharp(imageBuffer)
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .grayscale()
    .normalize()
    .png({ quality: 80 })
    .toBuffer();
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw;
}

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizeExtractedResult(input: unknown): ExtractedTrainData {
  if (!input || typeof input !== "object") {
    return EMPTY_RESULT;
  }

  const data = input as Record<string, unknown>;

  const asNullableString = (value: unknown) =>
    typeof value === "string" ? value.trim() || null : null;

  const rawStops = Array.isArray(data.stops) ? data.stops : [];
  const stops = rawStops
    .map((stop) => {
      if (!stop || typeof stop !== "object") return null;
      const item = stop as Record<string, unknown>;
      return {
        station_name_tamil: asNullableString(item.station_name_tamil),
        arrival_time: normalizeTime(asNullableString(item.arrival_time)),
        departure_time: normalizeTime(asNullableString(item.departure_time)),
      };
    })
    .filter((stop): stop is ExtractedTrainStop => Boolean(stop?.station_name_tamil));

  return {
    train_number: asNullableString(data.train_number),
    train_name_tamil: asNullableString(data.train_name_tamil),
    from_station_tamil: asNullableString(data.from_station_tamil),
    to_station_tamil: asNullableString(data.to_station_tamil),
    operating_days_tamil: asNullableString(data.operating_days_tamil),
    stops,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedLanguage = String(formData.get("ocrLanguage") ?? "eng");
    const ocrLanguage = ALLOWED_OCR_LANGUAGES.has(requestedLanguage)
      ? requestedLanguage
      : "eng";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image file with key 'file'." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const optimizedImage = await preprocessImageForOcr(imageBuffer);

    const ocrResult = await Tesseract.recognize(optimizedImage, ocrLanguage);
    const ocrText = ocrResult.data.text?.trim();

    if (!ocrText) {
      return NextResponse.json(
        {
          error: "OCR could not read any text from the image.",
          result: EMPTY_RESULT,
          ocrText: "",
        },
        { status: 422 }
      );
    }

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a train timetable extraction AI. Return only valid JSON and never include extra text.",
          },
          {
            role: "user",
            content: `OCR TEXT:\n${ocrText}\n\n${MASTER_PROMPT}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return NextResponse.json(
        { error: "OpenAI request failed.", details: errorText },
        { status: 502 }
      );
    }

    const data = (await openAiResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const rawContent = data.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJsonObject(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = EMPTY_RESULT;
    }

    const result = normalizeExtractedResult(parsed);

    return NextResponse.json({ result, ocrText });
  } catch (error) {
    console.error("[POST /api/extract]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
