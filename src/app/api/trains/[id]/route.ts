import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trainId = Number(id);
  if (isNaN(trainId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const train = await prisma.train.findFirst({
    where: {
      id: trainId,
      isActive: true,
    },
  });

  if (!train) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ train });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const trainId = Number(id);
  if (isNaN(trainId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

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
      isActive,
      imageUrl,
      scheduleBadgeText,
      scheduleBadgeColor,
      nextRunDate,
    } = body;

    const train = await prisma.train.update({
      where: { id: trainId },
      data: {
        ...(trainNumber && { trainNumber }),
        ...(title && { title }),
        ...(fromStation && { fromStation }),
        ...(toStation && { toStation }),
        ...(description && { description }),
        ...(timeTableJson !== undefined && {
          timeTableJson: Array.isArray(timeTableJson)
            ? JSON.stringify(timeTableJson)
            : (typeof timeTableJson === "string" ? timeTableJson : null),
        }),
        ...(scheduleType && { scheduleType }),
        scheduleDays: scheduleDays ? JSON.stringify(scheduleDays) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ...(isPremium !== undefined && { isPremium }),
        ...(isActive !== undefined && { isActive }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(scheduleBadgeText !== undefined && { scheduleBadgeText }),
        ...(scheduleBadgeColor !== undefined && { scheduleBadgeColor }),
        ...(nextRunDate !== undefined && { nextRunDate }),
      },
    });

    return NextResponse.json({ train });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Train number already exists. Please use a unique train number." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const trainId = Number(id);
  if (isNaN(trainId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await prisma.train.update({ where: { id: trainId }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
