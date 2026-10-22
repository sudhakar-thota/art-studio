import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/wall-bookings/[id] - View specific booking
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const booking = await prisma.wallBooking.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If booking does not exist OR (is customer and does not own this booking) -> return 404
    if (!booking || (auth.user.role === "CUSTOMER" && booking.userId !== auth.user.userId)) {
      return NextResponse.json(
        { error: "Wall booking not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Fetch wall booking detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking details." },
      { status: 500 }
    );
  }
}
