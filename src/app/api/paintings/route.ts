import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// GET /api/paintings - Browse all paintings (Customer: Yes, Admin: Yes)
export async function GET() {
  try {
    const paintings = await prisma.painting.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ paintings });
  } catch (error) {
    console.error("Fetch paintings error:", error);
    return NextResponse.json(
      { error: "Failed to load paintings." },
      { status: 500 }
    );
  }
}

// POST /api/paintings - Add a new painting (Admin only)
export async function POST(req: NextRequest) {
  // Check RBAC: Only ADMIN is allowed to add paintings
  const auth = await requireRole(req, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { title, description, price, dimensions, medium, imageUrl } = body;

    if (!title || !description || price === undefined || !dimensions || !medium) {
      return NextResponse.json(
        { error: "Title, description, price, dimensions, and medium are required." },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json(
        { error: "Price must be a positive number." },
        { status: 400 }
      );
    }

    const painting = await prisma.painting.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: numPrice,
        dimensions: dimensions.trim(),
        medium: medium.trim(),
        imageUrl:
          imageUrl && imageUrl.trim()
            ? imageUrl.trim()
            : "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
        status: "AVAILABLE",
      },
    });

    return NextResponse.json(
      { message: "Painting added successfully.", painting },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create painting error:", error);
    return NextResponse.json(
      { error: "Failed to add painting." },
      { status: 500 }
    );
  }
}
