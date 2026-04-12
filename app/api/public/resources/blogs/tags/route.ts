import { NextResponse } from "next/server";
import { getPublicBlogTags } from "@/lib/services/public-blog-service";

export async function GET() {
  try {
    const tags = await getPublicBlogTags();
    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    console.error("Error loading blog tags:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load blog tags" },
      { status: 500 }
    );
  }
}
