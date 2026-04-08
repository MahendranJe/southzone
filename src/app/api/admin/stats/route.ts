import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalTrains, activeAlerts, pendingPayments, completedPayments] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.train.count({ where: { isActive: true } }),
      prisma.alert.count({ where: { isActive: true } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        select: { amount: true },
      }),
    ]);

  const totalRevenue = completedPayments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

  return NextResponse.json({
    totalUsers,
    totalTrains,
    activeAlerts,
    pendingPayments,
    totalRevenue,
  });
}
