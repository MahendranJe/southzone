import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const alerts = await prisma.alert.findMany({
    include: {
      train: { select: { fromStation: true, toStation: true } },
      user: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ alerts });
}
