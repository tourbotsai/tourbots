import { NextRequest, NextResponse } from "next/server";
import { incrementPublicBlogViews } from "@/lib/services/public-blog-service";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await incrementPublicBlogViews(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error incrementing blog views:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to increment blog views" },
      { status: 500 }
    );
  }
}
