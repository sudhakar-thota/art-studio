import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// POST /api/orders/[id]/cancel - Cancel an order (Customer only, own record)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Customer only. Admin cannot cancel customer orders.
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { painting: true },
    });

    // Check ownership: if not found OR not owned by this customer -> 404
    if (!order || order.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order has already been cancelled." },
        { status: 400 }
      );
    }

    // Atomic transaction: mark order CANCELLED and restore painting to AVAILABLE
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
        include: { painting: true },
      });

      await tx.painting.update({
        where: { id: order.paintingId },
        data: { status: "AVAILABLE" },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      message: "Order successfully cancelled. The painting is now available again.",
      order: result,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order." },
      { status: 500 }
    );
  }
}
