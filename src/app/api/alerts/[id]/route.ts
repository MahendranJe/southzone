import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const alertId = Number(id);
  if (isNaN(alertId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const userId = Number(session.user.id);

  const alert = await prisma.alert.findFirst({ where: { id: alertId, userId } });
  if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.alert.update({ where: { id: alertId }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
