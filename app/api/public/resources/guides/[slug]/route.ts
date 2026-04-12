import { NextRequest, NextResponse } from "next/server";
import { getPublicGuideBySlug } from "@/lib/services/public-guide-service";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const guide = await getPublicGuideBySlug(slug);

    if (!guide) {
      return NextResponse.json({ success: false, error: "Guide not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, guide });
  } catch (error: any) {
    console.error("Error loading guide by slug:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load guide" },
      { status: 500 }
    );
  }
}
