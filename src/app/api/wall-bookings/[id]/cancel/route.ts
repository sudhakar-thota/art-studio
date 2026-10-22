import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { canCancelWallBooking } from "@/lib/utils";

// POST /api/wall-bookings/[id]/cancel - Customer cancels wall booking (at least 3 days prior)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const booking = await prisma.wallBooking.findUnique({
      where: { id: params.id },
    });

    // Check ownership: must exist and belong to current customer -> 404
    if (!booking || booking.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: "Wall booking not found." },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This booking is already cancelled." },
        { status: 400 }
      );
    }

    if (booking.status === "DECLINED") {
      return NextResponse.json(
        { error: "This booking was declined by the studio and cannot be cancelled." },
        { status: 400 }
      );
    }

    // Constraint: "A customer can cancel until 3 days before the date."
    const check = canCancelWallBooking(booking.bookingDate);
    if (!check.canCancel) {
      return NextResponse.json(
        { error: check.error },
        { status: 400 }
      );
    }

    const updated = await prisma.wallBooking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Wall painting booking has been cancelled successfully.",
      booking: updated,
    });
  } catch (error) {
    console.error("Cancel wall booking error:", error);
    return NextResponse.json(
      { error: "Failed to cancel wall booking." },
      { status: 500 }
    );
  }
}
