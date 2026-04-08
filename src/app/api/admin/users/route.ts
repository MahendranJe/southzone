import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "@/types/next-auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { username: { contains: search } },
          ],
        }
      : {},
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      phone: true,
      gender: true,
      state: true,
      city: true,
      role: true,
      plan: true,
      planExpiry: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
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
