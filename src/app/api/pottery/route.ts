import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { validatePotteryRequestInput } from "@/lib/utils";

// GET /api/pottery - List pottery requests (Customer: own only; Admin: all)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const isCustomer = auth.user.role === "CUSTOMER";

    const requests = await prisma.potteryRequest.findMany({
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch pottery requests error:", error);
    return NextResponse.json(
      { error: "Failed to load pottery requests." },
      { status: 500 }
    );
  }
}

// POST /api/pottery - Request custom pottery (Customer only)
export async function POST(req: NextRequest) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { item, glaze, quantity, neededByDate, notes } = body;

    const numQty = Number(quantity);

    // Business validation (1-12 qty, >= 14 days, item, glaze)
    const validation = validatePotteryRequestInput(numQty, neededByDate, item, glaze);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify item and glaze exist in seed data
    const seedItem = await prisma.potterySeedItem.findUnique({
      where: { name: item.trim() },
    });
    if (!seedItem) {
      return NextResponse.json(
        { error: `Invalid item '${item}'. Must be selected from available studio items.` },
        { status: 400 }
      );
    }

    const seedGlaze = await prisma.potterySeedGlaze.findUnique({
      where: { name: glaze.trim() },
    });
    if (!seedGlaze) {
      return NextResponse.json(
        { error: `Invalid glaze '${glaze}'. Must be selected from available studio glazes.` },
        { status: 400 }
      );
    }

    const newRequest = await prisma.potteryRequest.create({
      data: {
        userId: auth.user.userId,
        item: seedItem.name,
        glaze: seedGlaze.name,
        quantity: numQty,
        neededByDate,
        notes: notes ? notes.trim() : null,
        status: "REQUESTED",
      },
    });

    return NextResponse.json(
      {
        message: "Custom pottery request submitted successfully!",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create pottery request error:", error);
    return NextResponse.json(
      { error: "Failed to create pottery request." },
      { status: 500 }
    );
  }
}
