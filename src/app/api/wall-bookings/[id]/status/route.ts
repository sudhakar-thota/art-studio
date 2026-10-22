import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// PATCH /api/wall-bookings/[id]/status - Confirm or decline booking (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Admin only
  const auth = await requireRole(req, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !["CONFIRMED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Studio admin can only set status to 'CONFIRMED' or 'DECLINED'." },
        { status: 400 }
      );
    }

    const booking = await prisma.wallBooking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Wall booking not found." },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot modify a booking that was already cancelled by the customer." },
        { status: 400 }
      );
    }

    const updated = await prisma.wallBooking.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      message: `Booking has been ${status.toLowerCase()}.`,
      booking: updated,
    });
  } catch (error) {
    console.error("Update wall booking status error:", error);
    return NextResponse.json(
      { error: "Failed to update booking status." },
      { status: 500 }
    );
  }
}
