import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const alerts = await prisma.alert.findMany({
    where: { userId, isActive: true },
    include: { train: { select: { fromStation: true, toStation: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { trainId, travelDate } = body;

    if (!trainId) {
      return NextResponse.json({ error: "trainId is required" }, { status: 400 });
    }

    const train = await prisma.train.findUnique({
      where: { id: Number(trainId) },
      select: { id: true, trainNumber: true, title: true },
    });

    if (!train) {
      return NextResponse.json({ error: "Train not found" }, { status: 404 });
    }

    const userId = Number(session.user.id);

    const existing = await prisma.alert.findFirst({
      where: { userId, trainId: train.id, isActive: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Alert already set for this train" }, { status: 409 });
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        trainId: train.id,
        trainNumber: train.trainNumber,
        trainName: train.title,
        travelDate: travelDate ? new Date(travelDate) : null,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
