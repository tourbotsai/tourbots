import { NextRequest, NextResponse } from "next/server";
import { getPublicBlogs } from "@/lib/services/public-blog-service";

function parseFilters(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || undefined;
  const tagsParam = searchParams.get("tags");
  const tags = tagsParam
    ? tagsParam
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : undefined;
  const limitParam = Number(searchParams.get("limit"));
  const offsetParam = Number(searchParams.get("offset"));

  return {
    search,
    tags,
    limit: Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined,
    offset: Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseFilters(request);
    const blogs = await getPublicBlogs(filters);
    return NextResponse.json({ success: true, blogs });
  } catch (error: any) {
    console.error("Error loading public blogs:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load blogs" },
      { status: 500 }
    );
  }
}
