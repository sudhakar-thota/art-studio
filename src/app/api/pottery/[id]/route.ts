import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { validatePotteryRequestInput } from "@/lib/utils";

// GET /api/pottery/[id] - View specific pottery request
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const pottery = await prisma.potteryRequest.findUnique({
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

    // If request does not exist OR (is customer and does not own this request) -> return 404
    if (!pottery || (auth.user.role === "CUSTOMER" && pottery.userId !== auth.user.userId)) {
      return NextResponse.json(
        { error: "Pottery request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: pottery });
  } catch (error) {
    console.error("Fetch pottery detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pottery request." },
      { status: 500 }
    );
  }
}

// PUT /api/pottery/[id] - Edit pottery request (Customer only, while still REQUESTED)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const existing = await prisma.potteryRequest.findUnique({
      where: { id: params.id },
    });

    // Check ownership: 404 if not found or belongs to another customer
    if (!existing || existing.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: "Pottery request not found." },
        { status: 404 }
      );
    }

    // Constraint: "A customer can edit or cancel a request only while it is still requested."
    if (existing.status !== "REQUESTED") {
      return NextResponse.json(
        {
          error: `Cannot edit this request: only requests in 'REQUESTED' status can be modified. This request is currently '${existing.status}'.`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { item, glaze, quantity, neededByDate, notes } = body;

    const numQty = Number(quantity);

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

    const updated = await prisma.potteryRequest.update({
      where: { id: params.id },
      data: {
        item: seedItem.name,
        glaze: seedGlaze.name,
        quantity: numQty,
        neededByDate,
        notes: notes ? notes.trim() : null,
      },
    });

    return NextResponse.json({
      message: "Pottery request updated successfully.",
      request: updated,
    });
  } catch (error) {
    console.error("Update pottery request error:", error);
    return NextResponse.json(
      { error: "Failed to update pottery request." },
      { status: 500 }
    );
  }
}
