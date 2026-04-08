import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const fromStation = searchParams.get("from") ?? "";
  const toStation = searchParams.get("to") ?? "";
  const scheduleType = searchParams.get("scheduleType") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "6")));

  const session = await auth();
  const isPremiumUser = false; // Premium features hidden for now — all content is free

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { trainNumber: { contains: search, mode: "insensitive" as const } },
        { title: { contains: search, mode: "insensitive" as const } },
        { fromStation: { contains: search, mode: "insensitive" as const } },
        { toStation: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(fromStation && {
      fromStation: { contains: fromStation, mode: "insensitive" as const },
    }),
    ...(toStation && {
      toStation: { contains: toStation, mode: "insensitive" as const },
    }),
    ...(scheduleType && { scheduleType: scheduleType as never }),
  };

  try {
    const [total, trains] = await Promise.all([
      prisma.train.count({ where }),
      prisma.train.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          trainNumber: true,
          title: true,
          fromStation: true,
          toStation: true,
          description: true,
          timeTableJson: true,
          scheduleType: true,
          scheduleDays: true,
          startDate: true,
          endDate: true,
          isPremium: true,
          isActive: true,
          imageUrl: true,
          scheduleBadgeText: true,
          scheduleBadgeColor: true,
          nextRunDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({ trains, total, page, pageSize });
  } catch (err) {
    console.error("[GET /api/trains]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      trainNumber,
      title,
      fromStation,
      toStation,
      description,
      timeTableJson,
      scheduleType,
      scheduleDays,
      startDate,
      endDate,
      isPremium,
      imageUrl,
      scheduleBadgeText,
      scheduleBadgeColor,
      nextRunDate,
    } = body;

    if (!trainNumber || !title || !fromStation || !toStation || !description || !scheduleType) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const train = await prisma.train.create({
      data: {
        trainNumber,
        title,
        fromStation,
        toStation,
        description,
        timeTableJson: Array.isArray(timeTableJson)
          ? JSON.stringify(timeTableJson)
          : (typeof timeTableJson === "string" ? timeTableJson : null),
        scheduleType,
        scheduleDays: scheduleDays ? JSON.stringify(scheduleDays) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isPremium: isPremium ?? false,
        imageUrl: imageUrl ?? null,
        scheduleBadgeText: scheduleBadgeText ?? null,
        scheduleBadgeColor: scheduleBadgeColor ?? null,
        nextRunDate: nextRunDate ?? null,
      },
    });

    return NextResponse.json({ train }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Train number already exists. Please use a unique train number." },
        { status: 409 }
      );
    }
    console.error("[POST /api/trains]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
