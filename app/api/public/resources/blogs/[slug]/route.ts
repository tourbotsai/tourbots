import { NextRequest, NextResponse } from "next/server";
import { getPublicBlogBySlug } from "@/lib/services/public-blog-service";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const blog = await getPublicBlogBySlug(slug);

    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    console.error("Error loading blog by slug:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load blog" },
      { status: 500 }
    );
  }
}
