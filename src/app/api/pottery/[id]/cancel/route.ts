import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// POST /api/pottery/[id]/cancel - Customer cancels pottery request (while still REQUESTED)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // RBAC: Customer only
  const auth = await requireRole(req, ["CUSTOMER"]);
  if (auth.response) return auth.response;

  try {
    const pottery = await prisma.potteryRequest.findUnique({
      where: { id: params.id },
    });

    // Check ownership: 404 if not found or belongs to another customer
    if (!pottery || pottery.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: "Pottery request not found." },
        { status: 404 }
      );
    }

    // Constraint: "A customer can edit or cancel a request only while it is still requested."
    if (pottery.status !== "REQUESTED") {
      return NextResponse.json(
        {
          error: `A pottery request can only be cancelled while it is still requested. Current status is '${pottery.status}'.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.potteryRequest.update({
      where: { id: pottery.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      message: "Pottery request cancelled successfully.",
      request: updated,
    });
  } catch (error) {
    console.error("Cancel pottery request error:", error);
    return NextResponse.json(
      { error: "Failed to cancel pottery request." },
      { status: 500 }
    );
  }
}
