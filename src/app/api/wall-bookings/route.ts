import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { validateWallBookingInput } from "@/lib/utils";

// GET /api/wall-bookings - List bookings (Customer: own only; Admin: all)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const isCustomer = auth.user.role === "CUSTOMER";

    const bookings = await prisma.wallBooking.findMany({
      where: isCustomer ? { userId: auth.user.userId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { bookingDate: "asc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to load wall bookings." },
      { status: 500 }
    );
  }
}

// POST /api/wall-bookings - Book a wall date (Customer only)
export async function POST(req: NextRequest) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { bookingDate, wallSizeSqFt, address, notes } = body;

    const numWallSize = Number(wallSizeSqFt);

    // Business validation (7 to 90 days, 10 to 500 sq ft, address)
    const validation = validateWallBookingInput(bookingDate, numWallSize, address);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Atomic transaction checking date availability and booking
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch active rate
      const activeRate = await tx.wallRate.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
      const ratePerSqFt = activeRate ? activeRate.ratePerSqFt : 18.0;

      // 2. Concurrency check: each date can be booked only once (active: REQUESTED or CONFIRMED)
      const existing = await tx.wallBooking.findFirst({
        where: {
          bookingDate,
          status: { in: ["REQUESTED", "CONFIRMED"] },
        },
      });

      if (existing) {
        return {
          error: "This date has already been booked by another client. Please select a different date.",
          status: 409, // Conflict
        };
      }

      // 3. Compute price = wall size * rate from seed data
      const totalPrice = numWallSize * ratePerSqFt;

      // 4. Create booking
      const newBooking = await tx.wallBooking.create({
        data: {
          userId: auth.user.userId,
          bookingDate,
          wallSizeSqFt: numWallSize,
          ratePerSqFt,
          totalPrice,
          address: address.trim(),
          notes: notes ? notes.trim() : null,
          status: "REQUESTED",
        },
      });

      return { booking: newBooking };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        message: "Wall painting date requested successfully!",
        booking: result.booking,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create wall booking error:", error);
    return NextResponse.json(
      { error: "Failed to create wall painting booking." },
      { status: 500 }
    );
  }
}
