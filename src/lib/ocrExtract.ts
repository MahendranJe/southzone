import { createWorker } from "tesseract.js";

export interface RouteStop {
  station: string;
  arrival: string;
  departure: string;
}

export interface TimetableDirection {
  trainNumber: string | null;
  trainName: string | null;
  from: string | null;
  to: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  route: RouteStop[];
  operatingDays: string[];
  notes: string;
}

export interface TimetableData {
  directions: TimetableDirection[];
}

// Matches HH:MM, HH.MM, or 4-digit HHMM (e.g. 2340, 1045)
const TIME_RE = /\b(?:([01]?\d|2[0-3])[:.]([0-5]\d)|([01]\d|2[0-3])([0-5]\d))\b/;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_RE = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Daily)\b/gi;
// Matches full day names in parentheses like (Thursday), (Friday), (Saturday)
// Also matches OCR-truncated forms like (hursday), (riday), (iday), (aturday)
const DAY_PAREN_RE = /\([^)]*(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day|hursday|riday|iday|aturday|unday|onday)[^)]*\)/gi;

// OCR often misreads (a/d) as (o/d), (o/c), (a/c), (a/a), (d/d), etc.
// Also handles single-letter markers (a) (d) and pipe/bracket noise: |(a/d)|, [(a/d)]
// '(' is optional because OCR often drops it: "o/c)" ; "l" and "i" = OCR noise for "|" and "("
const DIRECTION_MARKER_RE = /[|\[\]li ]*\(?(?:[aAdDoOcC](?:\/[aAdDoOcC])?)\)[|\[\]li ]*/g;

/**
 * Run Tesseract OCR on an image (data URL or URL) and return the raw text.
 */
export async function runOCR(
  image: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  const worker = await createWorker("eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const {
    data: { text },
  } = await worker.recognize(image);

  await worker.terminate();
  return text;
}

/**
 * Normalise a time string into "HH:MM".
 * Handles "17.00", "8:35", and 4-digit "2340" / "1045".
 */
function normalizeTime(raw: string): string {
  // HH:MM or HH.MM
  const sep = raw.match(/(\d{1,2})[:.](\d{2})/);
  if (sep) return `${sep[1].padStart(2, "0")}:${sep[2]}`;
  // Raw 4-digit HHMM
  const four = raw.match(/^(\d{2})(\d{2})$/);
  if (four) return `${four[1]}:${four[2]}`;
  return raw;
}

/**
 * Strip day-name parenthetical tokens from a time string, then extract times.
 * Handles: "(Thursday)2340", "01.00 (Saturday)", "08.38/08.40", "2340".
 */
function extractTimes(text: string): string[] {
  // Remove (DayName) tokens first
  const cleaned = text.replace(DAY_PAREN_RE, " ").trim();
  const results: string[] = [];
  // Match HH.MM/HH.MM pairs, HH:MM/HH:MM pairs, standalone HH.MM or HH:MM, or raw 4-digit HHMM
  const re = /\b(\d{1,2}[.:]\d{2})(?:\/(\d{1,2}[.:]\d{2}))?\b|\b([01]\d|2[0-3])([0-5]\d)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    if (m[1]) {
      results.push(normalizeTime(m[1]));
      if (m[2]) results.push(normalizeTime(m[2]));
    } else if (m[3]) {
      results.push(normalizeTime(m[3] + m[4]));
    }
  }
  return results;
}

/**
 * Extract all 5-digit train numbers from text (deduplicated).
 */
function extractTrainNumbers(text: string): string[] {
  const nums: string[] = [];
  const re = /\b(\d{5})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!nums.includes(m[1])) nums.push(m[1]);
  }
  return nums;
}

/**
 * Extract operating days from full OCR text.
 */
function extractOperatingDays(text: string): string[] {
  const daySet = new Set<string>();
  DAY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = DAY_RE.exec(text)) !== null) {
    const d = m[1];
    if (/daily/i.test(d)) {
      DAY_NAMES.forEach((dn) => daySet.add(dn));
    } else {
      const short = d.slice(0, 3);
      const canon = DAY_NAMES.find((dn) => dn.toLowerCase() === short.toLowerCase());
      if (canon) daySet.add(canon);
    }
  }
  return DAY_NAMES.filter((d) => daySet.has(d));
}

/**
 * Try to parse a dual-direction timetable row.
 * Handles OCR noise: (a/d), (o/d), (o/c), (d), (a), pipes, brackets, etc.
 * Format: leftTimes (marker) Station (marker) rightTimes
 */
function parseDualDirectionLine(
  line: string
): { leftTimes: string[]; station: string; rightTimes: string[] } | null {
  const markers = [...line.matchAll(DIRECTION_MARKER_RE)];
  if (markers.length < 2) return null;

  const first = markers[0];
  const last = markers[markers.length - 1];

  const leftPart = line.slice(0, first.index!).trim();
  const middlePart = line.slice(first.index! + first[0].length, last.index!).trim();
  const rightPart = line.slice(last.index! + last[0].length).trim();

  // Strip any remaining markers, pipes, brackets from station name
  let station = middlePart
    .replace(DIRECTION_MARKER_RE, " ")
    .replace(/[|\\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Remove day names in parentheses like "(Thursday)" "(Friday)" "(Saturday)"
  station = station.replace(/\([^)]*(?:day|hursday|riday|aturday|unday|onday)[^)]*\)/gi, "").trim();

  if (!station || station.length < 2) return null;

  // Title case cleanup
  station = station
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  // Strip day-name parens from time parts before extraction
  const leftClean = leftPart.replace(DAY_PAREN_RE, " ").trim();
  const rightClean = rightPart.replace(DAY_PAREN_RE, " ").trim();

  const leftTimes = extractTimes(leftClean);
  const rightTimes = extractTimes(rightClean);

  if (leftTimes.length === 0 && rightTimes.length === 0) return null;

  return { leftTimes, station, rightTimes };
}

function buildDirection(
  route: RouteStop[],
  trainNumber: string | null,
  trainName: string | null,
  operatingDays: string[],
  notes: string
): TimetableDirection {
  // Fix last station: single time should be arrival not departure
  if (route.length > 1) {
    const last = route[route.length - 1];
    if (last.arrival === "--" && last.departure !== "--") {
      last.arrival = last.departure;
      last.departure = "--";
    }
  }
  return {
    trainNumber,
    trainName,
    from: route[0]?.station ?? null,
    to: route[route.length - 1]?.station ?? null,
    departureTime: route[0]?.departure ?? null,
    arrivalTime: route[route.length - 1]?.arrival ?? null,
    route,
    operatingDays,
    notes,
  };
}

/**
 * Normalize saved timetable JSON — handles old single-direction format
 * and new multi-direction format.
 */
export function normalizeTimetableData(raw: unknown): TimetableData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  // New format: has directions array
  if (Array.isArray(data.directions) && data.directions.length > 0) {
    return { directions: data.directions } as TimetableData;
  }

  // Old format: has route at top level
  if (Array.isArray(data.route)) {
    return {
      directions: [
        {
          trainNumber: (data.trainNumber as string) ?? null,
          trainName: (data.trainName as string) ?? null,
          from: (data.from as string) ?? null,
          to: (data.to as string) ?? null,
          departureTime: (data.departureTime as string) ?? null,
          arrivalTime: (data.arrivalTime as string) ?? null,
          route: data.route as RouteStop[],
          operatingDays: Array.isArray(data.operatingDays)
            ? (data.operatingDays as string[])
            : [],
          notes: (data.notes as string) ?? "",
        },
      ],
    };
  }

  return null;
}

/**
 * Best-effort parser for Indian Railway timetable OCR text.
 * Supports both single-direction and dual-direction (two trains) tables.
 */
export function parseTimetable(ocrText: string): TimetableData {
  const lines = ocrText.split("\n").map((l) => l.trim()).filter(Boolean);
  const operatingDays = extractOperatingDays(ocrText);
  const trainNumbers = extractTrainNumbers(ocrText);

  // --- Attempt dual-direction parse ---
  // Pattern: leftTimes (a/d) Station (a/d) rightTimes
  const dualParsed: Array<{
    leftTimes: string[];
    station: string;
    rightTimes: string[];
  }> = [];

  for (const line of lines) {
    const result = parseDualDirectionLine(line);
    if (result) dualParsed.push(result);
  }

  if (dualParsed.length >= 3) {
    // Direction 1 (↓): left column times, top to bottom
    const dir1Route: RouteStop[] = dualParsed.map((row, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === dualParsed.length - 1;
      if (row.leftTimes.length >= 2) {
        return {
          station: row.station,
          arrival: isFirst ? "--" : row.leftTimes[0],
          departure: isLast ? "--" : row.leftTimes[1],
        };
      }
      // Single time: first station = departure only, last station = arrival only
      return {
        station: row.station,
        arrival: isFirst ? "--" : (row.leftTimes[0] ?? "--"),
        departure: isFirst ? (row.leftTimes[0] ?? "--") : "--",
      };
    });

    // Direction 2 (↑): right column times, reversed (bottom to top)
    const dir2Rows = [...dualParsed].reverse();
    const dir2Route: RouteStop[] = dir2Rows.map((row, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === dir2Rows.length - 1;
      if (row.rightTimes.length >= 2) {
        return {
          station: row.station,
          arrival: isFirst ? "--" : row.rightTimes[0],
          departure: isLast ? "--" : row.rightTimes[1],
        };
      }
      return {
        station: row.station,
        arrival: isFirst ? "--" : (row.rightTimes[0] ?? "--"),
        departure: isFirst ? (row.rightTimes[0] ?? "--") : "--",
      };
    });

    return {
      directions: [
        buildDirection(dir1Route, trainNumbers[0] ?? null, null, operatingDays, ""),
        buildDirection(dir2Route, trainNumbers[1] ?? trainNumbers[0] ?? null, null, operatingDays, ""),
      ],
    };
  }

  // --- Fallback: single-direction parse ---
  let trainNumber: string | null = trainNumbers[0] ?? null;
  let trainName: string | null = null;

  if (trainNumber) {
    for (const line of lines) {
      if (line.includes(trainNumber)) {
        const rest = line.replace(trainNumber, "").replace(/[-–—/|]/g, " ").trim();
        if (rest.length > 2) trainName = rest;
        break;
      }
    }
  }

  const route: RouteStop[] = [];

  for (const line of lines) {
    const times = extractTimes(line);

    if (times.length === 0) continue;

    const firstTimeIdx = line.search(TIME_RE);
    const beforeTime = firstTimeIdx >= 0 ? line.slice(0, firstTimeIdx) : line;
    let station = beforeTime
      .replace(DAY_PAREN_RE, "")
      .replace(/\d+/g, "")
      .replace(/[|/\\–—\-:.,;]+/g, " ")
      .trim();

    if (!station || station.length < 2) continue;

    station = station
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const arrival = times.length >= 2 ? times[0] : "--";
    const departure = times.length >= 2 ? times[1] : times[0];

    route.push({ station, arrival, departure });
  }

  return {
    directions: [buildDirection(route, trainNumber, trainName, operatingDays, "")],
  };
}
