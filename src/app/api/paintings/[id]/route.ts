import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/paintings/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const painting = await prisma.painting.findUnique({
      where: { id: params.id },
    });

    if (!painting) {
      return NextResponse.json(
        { error: "Painting not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ painting });
  } catch (error) {
    console.error("Fetch painting detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch painting." },
      { status: 500 }
    );
  }
}

// PUT /api/paintings/[id] - Edit painting (Admin only, only while available)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Admin only
  const auth = await requireRole(req, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const painting = await prisma.painting.findUnique({
      where: { id: params.id },
    });

    if (!painting) {
      return NextResponse.json(
        { error: "Painting not found." },
        { status: 404 }
      );
    }

    // Constraint: Can only edit a painting while it is AVAILABLE
    if (painting.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: "Cannot edit this painting: only paintings that are currently available can be edited." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, price, dimensions, medium, imageUrl } = body;

    const numPrice = price !== undefined ? Number(price) : undefined;
    if (numPrice !== undefined && (isNaN(numPrice) || numPrice <= 0)) {
      return NextResponse.json(
        { error: "Price must be a valid positive number." },
        { status: 400 }
      );
    }

    const updated = await prisma.painting.update({
      where: { id: params.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(description && { description: description.trim() }),
        ...(numPrice !== undefined && { price: numPrice }),
        ...(dimensions && { dimensions: dimensions.trim() }),
        ...(medium && { medium: medium.trim() }),
        ...(imageUrl && { imageUrl: imageUrl.trim() }),
      },
    });

    return NextResponse.json({
      message: "Painting updated successfully.",
      painting: updated,
    });
  } catch (error) {
    console.error("Update painting error:", error);
    return NextResponse.json(
      { error: "Failed to update painting." },
      { status: 500 }
    );
  }
}
