import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const paymentId = Number(id);
  if (isNaN(paymentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const { status, notes } = await request.json();

    if (!["COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
      include: { user: { select: { id: true, fullName: true, plan: true } } },
    });

    // If approved, update user plan and expiry
    if (status === "COMPLETED") {
      const expiry = new Date();
      if (payment.plan === "MONTHLY") expiry.setMonth(expiry.getMonth() + 1);
      if (payment.plan === "PREMIUM") expiry.setFullYear(expiry.getFullYear() + 1);

      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan, planExpiry: expiry },
      });

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: "Subscription Activated!",
          message: `Your ${payment.plan} plan is now active until ${expiry.toLocaleDateString("en-IN")}.`,
          type: "SUCCESS",
        },
      });
    }

    if (status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: "Payment Rejected",
          message: `Your ${payment.plan} plan payment (UTR: ${payment.utrNumber}) was rejected. Please contact support.`,
          type: "WARNING",
        },
      });
    }

    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
