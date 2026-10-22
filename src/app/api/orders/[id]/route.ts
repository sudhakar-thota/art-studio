import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/orders/[id] - View specific order
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        painting: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If order does not exist OR (is customer and does not own this order) -> return 404
    if (!order || (auth.user.role === "CUSTOMER" && order.userId !== auth.user.userId)) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Fetch order detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}
