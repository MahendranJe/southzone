import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notifId = Number(id);
  if (isNaN(notifId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const userId = Number(session.user.id);

  const notif = await prisma.notification.findFirst({ where: { id: notifId, userId } });
  if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notification.update({ where: { id: notifId }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
