import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, username, password, phone, gender, state, city } = body;

    if (!fullName || !email || !username || !password) {
      return NextResponse.json(
        { error: "fullName, email, username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      return NextResponse.json({ error: `${field} already in use` }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        password: hashedPassword,
        phone: phone ?? null,
        gender: gender ?? null,
        state: state ?? null,
        city: city ?? null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    });

    // Send welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Southzone Railway!",
        message: `Hi ${user.fullName}, your account has been created successfully. Start tracking trains now.`,
        type: "SUCCESS",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
