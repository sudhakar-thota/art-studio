import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

// GET /api/orders - List orders (Customer: only own orders; Admin: all orders)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const isCustomer = auth.user.role === "CUSTOMER";

    const orders = await prisma.order.findMany({
      where: isCustomer ? { userId: auth.user.userId } : undefined,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 }
    );
  }
}

// POST /api/orders - Buy a painting (Customer only)
export async function POST(req: NextRequest) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { paintingId } = body;

    if (!paintingId) {
      return NextResponse.json(
        { error: "Painting ID is required." },
        { status: 400 }
      );
    }

    // Atomic transaction to prevent race conditions and ensure painting is only bought once
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch painting
      const painting = await tx.painting.findUnique({
        where: { id: paintingId },
      });

      if (!painting) {
        return { error: "Painting not found", status: 404 };
      }

      // 2. Concurrency check: must be AVAILABLE
      if (painting.status !== "AVAILABLE") {
        return {
          error: "This painting has already been purchased and is no longer available.",
          status: 409, // Conflict
        };
      }

      // 3. Mark painting as SOLD
      await tx.painting.update({
        where: { id: paintingId },
        data: { status: "SOLD" },
      });

      // 4. Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId: auth.user.userId,
          paintingId: painting.id,
          amount: painting.price,
          status: "PLACED",
        },
        include: {
          painting: true,
        },
      });

      return { order: newOrder };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
      {
        message: "Painting purchased successfully! Your order has been placed.",
        order: result.order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to place order." },
      { status: 500 }
    );
  }
}
