import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

// PATCH /api/pottery/[id]/status - Accept or decline pottery request (Admin only)
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

    if (!status || !["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Studio admin can only set status to 'ACCEPTED' or 'DECLINED'." },
        { status: 400 }
      );
    }

    const pottery = await prisma.potteryRequest.findUnique({
      where: { id: params.id },
    });

    if (!pottery) {
      return NextResponse.json(
        { error: "Pottery request not found." },
        { status: 404 }
      );
    }

    if (pottery.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot process a pottery request that was cancelled by the customer." },
        { status: 400 }
      );
    }

    const updated = await prisma.potteryRequest.update({
      where: { id: params.id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      message: `Pottery request has been ${status.toLowerCase()}.`,
      request: updated,
    });
  } catch (error) {
    console.error("Update pottery status error:", error);
    return NextResponse.json(
      { error: "Failed to update pottery request status." },
      { status: 500 }
    );
  }
}
