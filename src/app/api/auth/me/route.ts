import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const tokenPayload = await getUserFromRequest(req);
  if (!tokenPayload) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User account not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}
