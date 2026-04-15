import { NextResponse } from "next/server";
import sharp from "sharp";
import Tesseract from "tesseract.js";

export const runtime = "nodejs";

const MASTER_PROMPT = `You are an OCR + Data Extraction + Translation assistant for Indian Railway timetables.
All output text MUST be in Tamil (except numbers and time). Do NOT return English.

Step 1: Read the OCR text carefully and extract all visible text.

Step 2: IMPORTANT — Many Indian Railway timetables show TWO trains (opposite directions) in one table.
- Look for TWO train numbers (e.g., 06070 and 06069)
- Left column = Direction 1 (↓ down), Right column = Direction 2 (↑ up)
- Extract BOTH directions if present.

Step 3: For EACH direction, extract:
- Train Number (5 digits)
- Train Name in Tamil
- From Station in Tamil (first station)
- To Station in Tamil (last station)
- Operating Days in Tamil (e.g., "ஞாயிற்றுக்கிழமைகளில்", "திங்கட்கிழமைகளில்", "வியாழக்கிழமைகளில்")
- Date Range in Tamil (e.g., "19 ஏப்ரல் 2026 முதல் 07 ஜூன் 2026 வரை")
- Number of services in Tamil (e.g., "8 சேவைகள்", "3 சேவைகள்")
- Booking info in Tamil (e.g., "இந்த ரயிலுக்கான முன்பதிவு 15.04.2026 (புதன்கிழமை) காலை 08.00 மணிக்கு தொடங்கும்.")
- Station List in journey order with Arrival and Departure times

Step 4: Return STRICT JSON:

{
  "directions": [
    {
      "train_number": "",
      "train_name_tamil": "",
      "from_station_tamil": "",
      "to_station_tamil": "",
      "operating_days_tamil": "",
      "date_range_tamil": "",
      "services_count_tamil": "",
      "booking_info_tamil": "",
      "stops": [
        {
          "station_name_tamil": "",
          "arrival_time": "",
          "departure_time": ""
        }
      ]
    }
  ]
}

Rules:
- Tamil must be natural and correct (Chennai Egmore → சென்னை எக்மோர், Mumbai CST → மும்பை CST)
- Days must be in Tamil: Sunday = ஞாயிற்றுக்கிழமை, Monday = திங்கட்கிழமை, Tuesday = செவ்வாய்க்கிழமை, Wednesday = புதன்கிழமை, Thursday = வியாழக்கிழமை, Friday = வெள்ளிக்கிழமை, Saturday = சனிக்கிழமை
- Months in Tamil: January = ஜனவரி, February = பிப்ரவரி, March = மார்ச், April = ஏப்ரல், May = மே, June = ஜூன், July = ஜூலை, August = ஆகஸ்ட், September = செப்டம்பர், October = அக்டோபர், November = நவம்பர், December = டிசம்பர்
- Time format: HH:MM (24-hour). If not available, return null
- First station of each direction: arrival = null. Last station: departure = null
- If only one direction exists, return a single item in directions array
- For Direction 2 (↑ up), reverse station order from departure to arrival
- booking_info_tamil: include booking opening date/time if mentioned, else null
- Ensure JSON is valid (no extra text outside JSON)`;

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
  date_range_tamil: string | null;
  services_count_tamil: string | null;
  booking_info_tamil: string | null;
  stops: ExtractedTrainStop[];
};

const EMPTY_RESULT: ExtractedTrainData = {
  train_number: null,
  train_name_tamil: null,
  from_station_tamil: null,
  to_station_tamil: null,
  operating_days_tamil: null,
  date_range_tamil: null,
  services_count_tamil: null,
  booking_info_tamil: null,
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

function normalizeExtractedResult(input: unknown): ExtractedTrainData[] {
  if (!input || typeof input !== "object") {
    return [EMPTY_RESULT];
  }

  const data = input as Record<string, unknown>;

  // New format: has directions array
  if (Array.isArray(data.directions)) {
    const results = data.directions
      .map((dir) => normalizeSingleDirection(dir))
      .filter((d) => d.stops.length > 0 || d.train_number);
    return results.length > 0 ? results : [EMPTY_RESULT];
  }

  // Old format: single direction at top level
  return [normalizeSingleDirection(data)];
}

function normalizeSingleDirection(input: unknown): ExtractedTrainData {
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
    date_range_tamil: asNullableString(data.date_range_tamil),
    services_count_tamil: asNullableString(data.services_count_tamil),
    booking_info_tamil: asNullableString(data.booking_info_tamil),
    stops,
  };
}

export async function POST(request: Request) {
  // Support both Gemini (free) and OpenAI
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const useGemini = !!geminiKey;
  const apiKey = geminiKey ?? openaiKey;

  if (!apiKey || apiKey.includes("your-") || apiKey.includes("-here")) {
    return NextResponse.json(
      { error: "No AI API key configured. Set GEMINI_API_KEY (free) or OPENAI_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const providedOcrText = String(formData.get("ocrText") ?? "").trim();
    const requestedLanguage = String(formData.get("ocrLanguage") ?? "eng");
    const ocrLanguage = ALLOWED_OCR_LANGUAGES.has(requestedLanguage)
      ? requestedLanguage
      : "eng";

    if (!providedOcrText && !(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload an image file with key 'file' or provide OCR text." },
        { status: 400 }
      );
    }

    let ocrText = providedOcrText;

    if (!ocrText) {
      const arrayBuffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const optimizedImage = await preprocessImageForOcr(imageBuffer);

      const ocrResult = await Tesseract.recognize(optimizedImage, ocrLanguage);
      ocrText = ocrResult.data.text?.trim() ?? "";
    }

    if (!ocrText) {
      return NextResponse.json(
        {
          error: "OCR could not read any text from the image.",
          directions: [EMPTY_RESULT],
          ocrText: "",
        },
        { status: 422 }
      );
    }

    const fullPrompt = `OCR TEXT:\n${ocrText}\n\n${MASTER_PROMPT}`;
    let rawContent = "";

    if (useGemini) {
      // --- Google Gemini API (free tier) ---
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error("[Gemini Error]", errorText);

        if (
          geminiRes.status === 429 ||
          /RESOURCE_EXHAUSTED|quota exceeded|rate[- ]?limit/i.test(errorText)
        ) {
          return NextResponse.json(
            {
              error:
                "Gemini quota exceeded for this API key/project. Google returned free-tier limit 0 for the selected model. Enable billing in Google AI Studio, use a different provider key, or try the Local OCR path.",
              details: errorText,
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: "Gemini API request failed.", details: errorText },
          { status: 502 }
        );
      }

      const geminiData = (await geminiRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } else {
      // --- OpenAI API ---
      const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a train timetable extraction AI. Return only valid JSON and never include extra text.",
            },
            { role: "user", content: fullPrompt },
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
      rawContent = data.choices?.[0]?.message?.content ?? "";
    }

    const jsonText = extractJsonObject(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = EMPTY_RESULT;
    }

    const result = normalizeExtractedResult(parsed);

    return NextResponse.json({ directions: result, ocrText });
  } catch (error) {
    console.error("[POST /api/extract]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
