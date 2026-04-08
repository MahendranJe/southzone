import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number(session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where = {
    ...(isAdmin ? {} : { userId }),
    ...(status ? { status: status as never } : {}),
  };

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { plan, utrNumber, screenshotUrl, notes } = body;

    if (!plan || !utrNumber) {
      return NextResponse.json({ error: "plan and utrNumber are required" }, { status: 400 });
    }

    const planAmounts: Record<string, number> = { MONTHLY: 99, PREMIUM: 699 };
    const amount = planAmounts[plan];
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const userId = Number(session.user.id);

    const payment = await prisma.payment.create({
      data: {
        userId,
        plan,
        amount,
        utrNumber,
        screenshotUrl: screenshotUrl ?? null,
        notes: notes ?? null,
      },
    });

    // Notify admin (create a notification for all admins)
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    await prisma.notification.createMany({
    data: admins.map((admin: { id: number }) => ({
        userId: admin.id,
        title: "New Payment Received",
        message: `User #${userId} submitted a ${plan} plan payment. UTR: ${utrNumber}`,
        type: "INFO" as const,
      })),
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
