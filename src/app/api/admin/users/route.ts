import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const role   = searchParams.get("role") ?? "";
  const plan   = searchParams.get("plan") ?? "";
  const status = searchParams.get("status") ?? "";
  const page   = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));

  const where: Parameters<typeof prisma.user.findMany>[0]["where"] = {
    ...(search ? {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email:    { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
    ...(role   ? { role } : {}),
    ...(plan   ? { plan } : {}),
    ...(status === "active"   ? { isActive: true }  : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, username: true,
        phone: true, gender: true, state: true, city: true,
        role: true, plan: true, planExpiry: true, isActive: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ users, total, page, pageSize });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, role, plan, isActive } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(role !== undefined && { role }),
        ...(plan !== undefined && { plan }),
        ...(isActive !== undefined && { isActive }),
      },
      select: { id: true, fullName: true, email: true, role: true, plan: true, isActive: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = idParam ? Number(idParam) : NaN;

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const currentUserId = Number(session.user.id);
    if (Number.isFinite(currentUserId) && currentUserId === id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
