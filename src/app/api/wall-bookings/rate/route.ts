import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/wall-bookings/rate - Get current wall rate and reserved dates
export async function GET() {
  try {
    const wallRate = await prisma.wallRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const ratePerSqFt = wallRate ? wallRate.ratePerSqFt : 18.0;

    // Fetch dates that currently have an active booking (REQUESTED or CONFIRMED)
    const activeBookings = await prisma.wallBooking.findMany({
      where: {
        status: { in: ["REQUESTED", "CONFIRMED"] },
      },
      select: {
        bookingDate: true,
      },
    });

    const bookedDates = activeBookings.map((b) => b.bookingDate);

    return NextResponse.json({
      ratePerSqFt,
      bookedDates,
    });
  } catch (error) {
    console.error("Fetch wall rate error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate information." },
      { status: 500 }
    );
  }
}
