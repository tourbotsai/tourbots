import { NextRequest, NextResponse } from "next/server";
import { incrementPublicGuideViews } from "@/lib/services/public-guide-service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await incrementPublicGuideViews(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error incrementing guide views:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to increment guide views" },
      { status: 500 }
    );
  }
}
