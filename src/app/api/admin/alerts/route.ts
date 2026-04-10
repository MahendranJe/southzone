import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export const runtime = "nodejs";

// List all admin-created alerts
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ alerts });
}

// Create alert and broadcast notification to all active users
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, trainNumber, trainName } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and Description are required" }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        trainNumber: trainNumber?.trim() || null,
        trainName: trainName?.trim() || null,
      },
    });

    // Broadcast notification to every active user
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: `🚨 Alert: ${title.trim()}`,
          message: description.trim(),
          type: "WARNING",
        })),
      });
    }

    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/alerts]", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Soft delete an alert
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
  }

  try {
    await prisma.alert.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
}
