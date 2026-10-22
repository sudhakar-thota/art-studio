import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pottery/catalog - Returns seed items and glazes
export async function GET() {
  try {
    const items = await prisma.potterySeedItem.findMany({
      orderBy: { basePrice: "asc" },
    });

    const glazes = await prisma.potterySeedGlaze.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ items, glazes });
  } catch (error) {
    console.error("Fetch pottery catalog error:", error);
    return NextResponse.json(
      { error: "Failed to load pottery catalog." },
      { status: 500 }
    );
  }
}
